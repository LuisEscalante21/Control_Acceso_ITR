from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime
import pytz
import os
from Config import PORT_ACCESO
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)

# 🔹 Configuración CORS
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# 🔹 Configuración de Zona Horaria de San Salvador
SV_TZ = pytz.timezone('America/El_Salvador')

# 🔹 Configuración MongoDB y API Key
MONGO_URI = os.getenv("DB_URI")
DB_NAME = os.getenv("DB_NAME")
API_ACCESS_KEY = os.getenv("API_ACCESS_KEY")

ACCESS_COLLECTION_NAME = "registrationAccess"
EMPLOYEE_COLLECTION_NAME = "employees"
ADMIN_COLLECTION_NAME = "administrators"
COORDINATOR_COLLECTION_NAME = "coordinators"

# 🔹 Conexión a MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

access_collection = db[ACCESS_COLLECTION_NAME]
employee_collection = db[EMPLOYEE_COLLECTION_NAME]


# ------------------------------
# Funciones Utilitarias
# ------------------------------

def get_sv_time():
    return datetime.now(SV_TZ)


def convert_to_sv_time(dt):
    if dt is None:
        return None
    return SV_TZ.localize(dt) if dt.tzinfo is None else dt.astimezone(SV_TZ)


def _norm(s: str) -> str:
    if not s:
        return ""
    s = s.lower()
    s = s.replace("á", "a").replace("é", "e").replace("í", "i") \
         .replace("ó", "o").replace("ú", "u")
    return s


def _normalize_schedule_keys(schedule: dict) -> dict:
    if not isinstance(schedule, dict):
        return {}
    out = {}
    for dia, bloques in schedule.items():
        dia_k = _norm(dia)
        out[dia_k] = {}
        if isinstance(bloques, dict):
            for sec, data in bloques.items():
                out[dia_k][_norm(sec)] = data
    return out


def require_api_key(f):
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get("Authorization", None)
        if not auth or not auth.startswith("Bearer "):
            return jsonify({"error": "API Key faltante o inválida"}), 401
        token = auth.split(" ")[1]
        if token != API_ACCESS_KEY:
            return jsonify({"error": "API Key inválida"}), 403
        return f(*args, **kwargs)
    return decorated


def parse_hora(hora_str):
    if not hora_str:
        return None
    hora_str = str(hora_str).strip().upper()
    formatos = ["%H:%M", "%I:%M%p"]
    for fmt in formatos:
        try:
            return datetime.strptime(hora_str, fmt).time()
        except ValueError:
            continue
    raise ValueError(f"Formato de hora inválido: {hora_str}")


def validar_horario(schedule, ahora: datetime, tipo: str):
    ahora = convert_to_sv_time(ahora)
    dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    dia = dias[ahora.weekday()]
    seccion = "Matutino" if ahora.hour < 12 else "Vespertino"

    schedule_n = _normalize_schedule_keys(schedule)
    bloque = schedule_n.get(_norm(dia), {}).get(_norm(seccion))
    if not bloque:
        return "Sin horario asignado"

    try:
        hora_inicio = parse_hora(bloque.get("start"))
        hora_fin = parse_hora(bloque.get("end"))
    except ValueError as e:
        return str(e)

    if not hora_inicio or not hora_fin:
        return "Horario incompleto"

    hora_actual = ahora.time()
    if tipo == "entrada" and hora_actual > hora_inicio:
        return "Tarde"
    if tipo == "salida" and hora_actual < hora_fin:
        return "Salió antes"
    return "A tiempo"


def convert_objectid(obj):
    if isinstance(obj, dict):
        return {k: convert_objectid(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectid(i) for i in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    return obj


def limpiar_registro(reg):
    reg = convert_objectid(reg)
    if "entry_time" in reg and isinstance(reg["entry_time"], datetime):
        reg["entry_time"] = convert_to_sv_time(reg["entry_time"]).isoformat()
    if "exit_time" in reg and isinstance(reg["exit_time"], datetime):
        reg["exit_time"] = convert_to_sv_time(reg["exit_time"]).isoformat()
    return reg


# ------------------------------
# Rutas de API
# ------------------------------

@app.route("/api/access", methods=["POST"])
@require_api_key
def crear_o_actualizar_acceso():
    data = request.get_json() or {}
    user_id = data.get("id_Employee")
    date_str = data.get("date")
    if not user_id or not date_str:
        return jsonify({"error": "Faltan datos: id_Employee o date"}), 400

    update_data = {}
    tiene_entrada = tiene_salida = False

    user_collections = [
        ("Employee", db[EMPLOYEE_COLLECTION_NAME]),
        ("Coordinator", db[COORDINATOR_COLLECTION_NAME]),
        ("Administrator", db[ADMIN_COLLECTION_NAME]),
    ]

    user_type = user_data = user_mongo_id = None

    for tipo, collection in user_collections:
        user = collection.find_one({"_id": ObjectId(user_id)}) if ObjectId.is_valid(user_id) else None
        user = user or collection.find_one({"numEmpleado": user_id})
        if user:
            user_type = tipo
            user_data = user
            user_mongo_id = str(user["_id"])
            break

    if not user_type:
        return jsonify({"error": "Usuario no encontrado"}), 404

    filter_query = {"id_Employee": user_mongo_id, "date": date_str}
    update_data["id_Employee"] = user_mongo_id

    horario = user_data.get("schedule", {}) if user_type != "Administrator" else {}

    if "entry_time" in data:
        try:
            entry_time = convert_to_sv_time(datetime.fromisoformat(data["entry_time"]))
            update_data["entry_time"] = entry_time
            update_data["entry_result"] = validar_horario(horario, entry_time, "entrada")
            tiene_entrada = True
        except Exception as e:
            return jsonify({"error": f"Formato inválido para entry_time: {str(e)}"}), 400

    if "entry_photo" in data:
        update_data["entry_photo"] = data["entry_photo"]
        tiene_entrada = True

    if "exit_time" in data:
        try:
            exit_time = convert_to_sv_time(datetime.fromisoformat(data["exit_time"]))
            update_data["exit_time"] = exit_time
            update_data["exit_result"] = validar_horario(horario, exit_time, "salida")
            tiene_salida = True
        except Exception as e:
            return jsonify({"error": f"Formato inválido para exit_time: {str(e)}"}), 400

    if "exit_photo" in data:
        update_data["exit_photo"] = data["exit_photo"]
        tiene_salida = True

    update_data["date"] = date_str
    update_data["user_type"] = user_type

    if tiene_entrada and tiene_salida:
        update_data["tipo_registro"] = "entrada y salida"
    elif tiene_entrada:
        update_data["tipo_registro"] = "entrada"
    elif tiene_salida:
        update_data["tipo_registro"] = "salida"
    else:
        update_data["tipo_registro"] = "desconocido"

    result = access_collection.update_one(filter_query, {"$set": update_data}, upsert=True)

    return jsonify({
        "message": "Registro de acceso creado o actualizado exitosamente",
        "user_type": user_type,
    }), (201 if result.upserted_id or result.modified_count > 0 else 200)


@app.route("/api/access", methods=["GET"])
@require_api_key
def obtener_todos_registros():
    try:
        team_id = request.args.get("teamId")
        exclude_employee_id = request.args.get("excludeEmployeeId")
        only_employee_id = request.args.get("onlyEmployeeId")

        pipeline = []
        pre_match = {}

        if only_employee_id and only_employee_id != "Admin":
            pre_match["id_Employee"] = only_employee_id
        if exclude_employee_id:
            pre_match["id_Employee"] = {"$ne": exclude_employee_id}
        if pre_match:
            pipeline.append({"$match": pre_match})

        pipeline.append({
            "$addFields": {
                "idEmpObj": {
                    "$cond": {
                        "if": {
                            "$regexMatch": {
                                "input": "$id_Employee",
                                "regex": "^[a-fA-F0-9]{24}$",
                            }
                        },
                        "then": {"$toObjectId": "$id_Employee"},
                        "else": None,
                    }
                }
            }
        })

        if team_id:
            try:
                team_object_id = ObjectId(team_id)
            except Exception:
                return jsonify({"error": "teamId inválido"}), 400

            empleados_cursor = employee_collection.find(
                {"id_team": team_object_id},
                {"_id": 1}
            )
            emp_ids = [e["_id"] for e in empleados_cursor]

            if not emp_ids:
                return jsonify([])

            pipeline.append({"$match": {"idEmpObj": {"$in": emp_ids}}})

        pipeline += [
            {
                "$lookup": {
                    "from": "employees",
                    "localField": "idEmpObj",
                    "foreignField": "_id",
                    "as": "employee",
                }
            },
            {"$unwind": {"path": "$employee", "preserveNullAndEmptyArrays": True}},
            {
                "$project": {
                    "_id": 1,
                    "date": 1,
                    "entry_result": 1,
                    "entry_time": 1,
                    "exit_result": 1,
                    "exit_time": 1,
                    "id_Employee": 1,
                    "tipo_registro": 1,
                    "employeeName": {
                        "$trim": {
                            "input": {
                                "$concat": [
                                    {"$ifNull": ["$employee.names", ""]},
                                    " ",
                                    {"$ifNull": ["$employee.surnames", ""]},
                                ]
                            }
                        }
                    },
                    "employeeAvatar": "$employee.photo",
                }
            },
        ]

        cursor = access_collection.aggregate(pipeline)
        registros = [limpiar_registro(reg) for reg in cursor]
        return jsonify(registros)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/access/<id>", methods=["GET"])
@require_api_key
def obtener_registro_por_id(id):
    try:
        reg = access_collection.find_one({"_id": ObjectId(id)})
        if not reg:
            return jsonify({"error": "Registro no encontrado"}), 404
        return jsonify(limpiar_registro(reg))
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/access/<id>", methods=["PATCH"])
@require_api_key
def editar_registro(id):
    data = request.get_json() or {}
    update_data = {}

    if "entry_time" in data:
        try:
            update_data["entry_time"] = convert_to_sv_time(datetime.fromisoformat(data["entry_time"]))
        except Exception:
            return jsonify({"error": "Formato inválido para entry_time"}), 400

    if "entry_result" in data:
        update_data["entry_result"] = data["entry_result"]
    if "entry_photo" in data:
        update_data["entry_photo"] = data["entry_photo"]
    if "exit_time" in data:
        try:
            update_data["exit_time"] = convert_to_sv_time(datetime.fromisoformat(data["exit_time"]))
        except Exception:
            return jsonify({"error": "Formato inválido para exit_time"}), 400
    if "exit_result" in data:
        update_data["exit_result"] = data["exit_result"]
    if "exit_photo" in data:
        update_data["exit_photo"] = data["exit_photo"]
    if "date" in data:
        update_data["date"] = data["date"]

    if not update_data:
        return jsonify({"error": "No hay campos para actualizar"}), 400

    try:
        result = access_collection.update_one({"_id": ObjectId(id)}, {"$set": update_data})
        if result.modified_count == 0:
            return jsonify({"message": "No se modificó ningún registro"}), 200
        return jsonify({"message": "Registro actualizado correctamente"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/access/<id>", methods=["DELETE"])
@require_api_key
def eliminar_registro(id):
    try:
        result = access_collection.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            return jsonify({"error": "Registro no encontrado"}), 404
        return jsonify({"message": "Registro eliminado correctamente"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# ------------------------------
# Iniciar aplicación
# ------------------------------

def iniciar_api_acceso():
    print("La API de registro de acceso ha iniciado.")
    print(f"Zona horaria configurada: {SV_TZ}")
    print(f"Hora actual en San Salvador: {get_sv_time()}")
    app.run(debug=True, use_reloader=False, host="0.0.0.0", port=PORT_ACCESO)


if __name__ == "__main__":
    iniciar_api_acceso()
