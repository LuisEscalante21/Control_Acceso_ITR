from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime
import os
from Config import PORT_ACCESO
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)

# 🔹 Configuración CORS (para evitar preflight errors)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Configuración MongoDB y API Key
MONGO_URI = os.getenv("DB_URI")
DB_NAME = os.getenv("DB_NAME")
ACCESS_COLLECTION_NAME = "registrationAccess"
EMPLOYEE_COLLECTION_NAME = "employees"  # Colección de empleados
ADMIN_COLLECTION_NAME = "administrators" # Colección de administradores
COORDINATOR_COLLECTION_NAME = "coordinators" # Colección de coordinadores

API_ACCESS_KEY = os.getenv("API_ACCESS_KEY")

# Conexión a MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Definir colecciones después de crear la conexión
access_collection = db[ACCESS_COLLECTION_NAME]
employee_collection = db[EMPLOYEE_COLLECTION_NAME]

# Decorador para validar API Key en header Authorization
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


# Función para validar horario
def validar_horario(schedule, ahora, tipo):
    dias = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"]
    dia = dias[ahora.weekday()]
    seccion = "Matutino" if ahora.hour < 12 else "Vespertino"
    bloque = schedule.get(dia, {}).get(seccion)
    if not bloque:
        return "Sin horario asignado"
    hora_actual = ahora.strftime("%H:%M")
    if tipo == "entrada" and hora_actual > bloque["start"]:
        return "Tarde"
    if tipo == "salida" and hora_actual < bloque["end"]:
        return "Salió antes"
    return "A tiempo"


# Función recursiva para convertir ObjectId a string en cualquier nivel
def convert_objectid(obj):
    if isinstance(obj, dict):
        return {k: convert_objectid(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectid(i) for i in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    else:
        return obj


# Utilidad para limpiar documentos de MongoDB para JSON
def limpiar_registro(reg):
    reg = convert_objectid(reg)  # convierte ObjectId a string
    if "entry_time" in reg and reg["entry_time"]:
        reg["entry_time"] = reg["entry_time"].isoformat()
    if "exit_time" in reg and reg["exit_time"]:
        reg["exit_time"] = reg["exit_time"].isoformat()
    return reg


# Crear o actualizar registro de acceso
@app.route("/api/access", methods=["POST"])
@require_api_key
def crear_o_actualizar_acceso():
    data = request.get_json()
    user_id = data.get("id_Employee")  # o id_User
    date_str = data.get("date")
    if not user_id or not date_str:
        return jsonify({"error": "Faltan datos: id_Employee o date"}), 400

    filter_query = {"id_Employee": user_id, "date": date_str}
    update_data = {}
    tiene_entrada = False
    tiene_salida = False

    # Búsqueda en las 3 colecciones
    user_collections = [
        ("Employee", db.EMPLOYEE_COLLECTION_NAME),
        ("Coordinator", db[COORDINATOR_COLLECTION_NAME]),
        ("Administrator", db[ADMIN_COLLECTION_NAME])
    ]
    
    user_type = None
    user_data = None

    for tipo, collection in user_collections:
        try:
            user = collection.find_one({"_id": ObjectId(user_id)})
        except Exception:
            continue
        if user:
            user_type = tipo
            user_data = user
            break

    if not user_type:
        return jsonify({"error": "Usuario no encontrado"}), 404

    horario = user_data.get("schedule", {}) if user_type != "Administrator" else {}

    # Procesar entrada
    if "entry_time" in data:
        try:
            entry_time = datetime.fromisoformat(data["entry_time"])
            update_data["entry_time"] = entry_time
            update_data["entry_result"] = validar_horario(horario, entry_time, "entrada")
            tiene_entrada = True
        except Exception:
            return jsonify({"error": "Formato inválido para entry_time"}), 400
    if "entry_photo" in data:
        update_data["entry_photo"] = data["entry_photo"]
        tiene_entrada = True

    # Procesar salida
    if "exit_time" in data:
        try:
            exit_time = datetime.fromisoformat(data["exit_time"])
            update_data["exit_time"] = exit_time
            update_data["exit_result"] = validar_horario(horario, exit_time, "salida")
            tiene_salida = True
        except Exception:
            return jsonify({"error": "Formato inválido para exit_time"}), 400
    if "exit_photo" in data:
        update_data["exit_photo"] = data["exit_photo"]
        tiene_salida = True

    if not update_data:
        return jsonify({"error": "No se proporcionaron campos para actualizar"}), 400

    update_data["date"] = date_str
    update_data["user_type"] = user_type  # Guardamos el tipo de usuario

    # Determinar tipo de registro
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
        "user_type": user_type
    }), 201 if result.upserted_id or result.modified_count > 0 else 200


# Endpoint para obtener todos los registros de acceso (esto para rol de administrador)
@app.route("/api/access", methods=["GET"])
@require_api_key
def obtener_todos_registros():
    try:
        team_id = request.args.get("teamId")
        exclude_employee_id = request.args.get("excludeEmployeeId")
        only_employee_id = request.args.get("onlyEmployeeId")

        pipeline = []

        # --- Filtros iniciales sobre el campo string id_Employee ---
        pre_match = {}
        if only_employee_id:
            # Si es Admin → no filtramos, devuelve todo
            if only_employee_id != "Admin":
                pre_match["id_Employee"] = only_employee_id
        if exclude_employee_id:
            pre_match["id_Employee"] = {"$ne": exclude_employee_id}
        if pre_match:
            pipeline.append({"$match": pre_match})

        # 🔹 AddFields seguro para evitar error con "Admin"
        pipeline.append({
            "$addFields": {
                "idEmpObj": {
                    "$cond": {
                        "if": {"$regexMatch": {"input": "$id_Employee", "regex": "^[a-fA-F0-9]{24}$"}},
                        "then": {"$toObjectId": "$id_Employee"},
                        "else": None
                    }
                }
            }
        })

        # --- Filtro por área: employees con IdTeam._id === teamId ---
        if team_id:
            try:
                team_object_id = ObjectId(team_id)
            except Exception:
                return jsonify({"error": "teamId inválido"}), 400

            empleados_cursor = employee_collection.find(
                {"IdTeam._id": team_object_id},
                {"_id": 1}
            )
            emp_ids = [e["_id"] for e in empleados_cursor]
            if not emp_ids:
                return jsonify([])  # no hay empleados en esa área

            pipeline.append({"$match": {"idEmpObj": {"$in": emp_ids}}})

        # --- Lookup para traer datos del empleado
        pipeline += [
            {
                "$lookup": {
                    "from": "employees",
                    "localField": "idEmpObj",
                    "foreignField": "_id",
                    "as": "employee"
                }
            },
            {"$unwind": {"path": "$employee", "preserveNullAndEmptyArrays": True}},
            {
                "$project": {
                    "_id": 1,
                    "date": 1,
                    "entry_photo": 1,
                    "entry_result": 1,
                    "entry_time": 1,
                    "exit_photo": 1,
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
                                    {"$ifNull": ["$employee.surnames", ""]}
                                ]
                            }
                        }
                    },
                    "employeeAvatar": "$employee.photo"
                }
            }
        ]

        cursor = access_collection.aggregate(pipeline)
        registros = [limpiar_registro(reg) for reg in cursor]

        return jsonify(registros)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Endpoint para obtener todos los registros de acceso (esto para rol de empleado)
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


# Endpoint para editar un registro de acceso específico
@app.route("/api/access/<id>", methods=["PATCH"])
@require_api_key
def editar_registro(id):
    data = request.get_json()
    update_data = {}

    if "entry_time" in data:
        try:
            update_data["entry_time"] = datetime.fromisoformat(data["entry_time"])
        except Exception:
            return jsonify({"error": "Formato inválido para entry_time"}), 400
    if "entry_result" in data:
        update_data["entry_result"] = data["entry_result"]
    if "entry_photo" in data:
        update_data["entry_photo"] = data["entry_photo"]
    if "exit_time" in data:
        try:
            update_data["exit_time"] = datetime.fromisoformat(data["exit_time"])
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


# Endpoint para eliminar un registro de acceso específico
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


# Endpoint para eliminar todos los registros de acceso
@app.route("/api/access", methods=["DELETE"])
@require_api_key
def eliminar_todos_registros():
    try:
        result = access_collection.delete_many({})
        return jsonify({
            "message": "Todos los registros de acceso han sido eliminados",
            "deleted_count": result.deleted_count
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def iniciar_api_acceso():
    print("La API de registro de acceso ha iniciado.")
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=PORT_ACCESO)

if __name__ == "__main__":
    iniciar_api_acceso()
