# registro_acceso.py
import requests
from datetime import datetime
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración
MONGO_URI = os.getenv("DB_URI")
DB_NAME = os.getenv("DB_NAME")
COLLECTION_NAME = os.getenv("DB_COLLECTION", "faces")
ACCESS_COLLECTION_NAME = "accesscontrols"  # Colección de registros de acceso
API_ACCESS_URL = "http://localhost:4000/api/access"
SCHEDULES_URL = "http://localhost:4000/api/schedules"

# Conexión a MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
faces_collection = db[COLLECTION_NAME]
access_collection = db[ACCESS_COLLECTION_NAME]

def get_schedule_for_face(employee_code):
    face_doc = faces_collection.find_one({"employee_code": employee_code})
    if not face_doc or "schedule_id" not in face_doc:
        return None, None

    schedule_id = face_doc["schedule_id"]

    # Obtener todos los horarios y filtrar
    res = requests.get(SCHEDULES_URL)
    if res.status_code != 200:
        return None, None

    schedules = res.json()
    schedule = next((s for s in schedules if s["_id"] == schedule_id), None)
    return schedule, face_doc["_id"]

def validar_horario(schedule, ahora, tipo):
    dias = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"]
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

def registrar_acceso(employee_code, tipo="entrada", photo_url=None):
    ahora = datetime.now()
    fecha_str = ahora.strftime("%Y-%m-%d")

    # Evitar registros duplicados para el mismo día y tipo
    ya_registrado = access_collection.find_one({
        "id_Employee": employee_code,
        "date": fecha_str,
        f"{tipo}_time": {"$exists": True}
    })

    if ya_registrado:
        print(f"[INFO] Ya existe un registro de {tipo} para hoy. No se registrará de nuevo.")
        return False

    # Obtener horario
    schedule, face_id = get_schedule_for_face(employee_code)
    if not schedule:
        print("[ERROR] No se encontró el horario para el empleado.")
        return False

    resultado = validar_horario(schedule, ahora, tipo)

    # Preparar datos
    data = {
        "id_Employee": employee_code,
        "date": fecha_str,
        f"{tipo}_time": ahora.isoformat(),
        f"{tipo}_result": resultado,
        f"{tipo}_photo": photo_url or "",
    }

    # Enviar POST a API de acceso
    res = requests.post(API_ACCESS_URL, json=data)
    if res.status_code in [200, 201]:
        print(f"[ACCESO] {tipo.title()} registrada correctamente: {resultado}")
        return True
    else:
        print("[ERROR] Fallo al registrar acceso:", res.text)
        return False
