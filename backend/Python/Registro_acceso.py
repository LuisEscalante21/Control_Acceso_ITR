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
CORS(app)

# Configuración MongoDB y API Key
MONGO_URI = os.getenv("DB_URI")
DB_NAME = os.getenv("DB_NAME")
ACCESS_COLLECTION_NAME = "registrationAccess"

API_ACCESS_KEY = os.getenv("API_ACCESS_KEY")

# Conexión a MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
access_collection = db[ACCESS_COLLECTION_NAME]

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

# Función para validar horario (igual que tu función)
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
    reg = convert_objectid(reg)  # convierte ObjectId a string en todo el documento
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
    employee_code = data.get("id_Employee")
    date_str = data.get("date")
    if not employee_code or not date_str:
        return jsonify({"error": "Faltan datos: id_Employee o date"}), 400

    filter_query = {"id_Employee": employee_code, "date": date_str}
    update_data = {}

    # Variables para identificar tipo de registro
    tiene_entrada = False
    tiene_salida = False

    if "entry_time" in data:
        try:
            update_data["entry_time"] = datetime.fromisoformat(data["entry_time"])
            tiene_entrada = True
        except Exception:
            return jsonify({"error": "Formato inválido para entry_time"}), 400
    if "entry_result" in data:
        update_data["entry_result"] = data["entry_result"]
        tiene_entrada = True
    if "entry_photo" in data:
        update_data["entry_photo"] = data["entry_photo"]
        tiene_entrada = True

    if "exit_time" in data:
        try:
            update_data["exit_time"] = datetime.fromisoformat(data["exit_time"])
            tiene_salida = True
        except Exception:
            return jsonify({"error": "Formato inválido para exit_time"}), 400
    if "exit_result" in data:
        update_data["exit_result"] = data["exit_result"]
        tiene_salida = True
    if "exit_photo" in data:
        update_data["exit_photo"] = data["exit_photo"]
        tiene_salida = True

    if not update_data:
        return jsonify({"error": "No se proporcionaron campos para actualizar"}), 400

    update_data["date"] = date_str

    # Agregar campo "tipo_registro"
    if tiene_entrada and tiene_salida:
        update_data["tipo_registro"] = "entrada y salida"
    elif tiene_entrada:
        update_data["tipo_registro"] = "entrada"
    elif tiene_salida:
        update_data["tipo_registro"] = "salida"
    else:
        update_data["tipo_registro"] = "desconocido"

    result = access_collection.update_one(filter_query, {"$set": update_data}, upsert=True)

    if result.upserted_id or result.modified_count > 0:
        return jsonify({"message": "Registro de acceso creado o actualizado exitosamente"}), 201
    else:
        return jsonify({"message": "No se modificó ningún registro"}), 200


# Obtener todos los registros
@app.route("/api/access", methods=["GET"])
@require_api_key
def obtener_todos_registros():
    registros = []
    cursor = access_collection.find()
    for reg in cursor:
        registros.append(limpiar_registro(reg))
    return jsonify(registros)

# Obtener registro por ID
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

# Editar registro por ID (PATCH)
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

# Eliminar registro por ID
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

def iniciar_api_acceso():
    print("La API de registro de acceso ha iniciado.")
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=PORT_ACCESO)

if __name__ == "__main__":
    iniciar_api_acceso()
