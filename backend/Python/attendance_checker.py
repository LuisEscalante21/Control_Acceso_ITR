import os
import requests
from pymongo import MongoClient
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de MongoDB y API
MONGO_URI = os.getenv("DB_URI")
DB_NAME = os.getenv("DB_NAME")
API_URL = f"http://localhost:4000/api/absences" 
API_KEY = os.getenv("API_ACCESS_KEY")

# Nombres de colecciones
EMPLOYEE_COLLECTION_NAME = "employees"
ACCESS_COLLECTION_NAME = "registrationAccess"
COORDINATOR_COLLECTION_NAME = "coordinators" # Incluir si manejan horarios
ADMIN_COLLECTION_NAME = "administrators"     # Excluir de inasistencias

# Conexión a MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
employee_collection = db[EMPLOYEE_COLLECTION_NAME]
access_collection = db[ACCESS_COLLECTION_NAME]
coordinator_collection = db[COORDINATOR_COLLECTION_NAME]

# -----------------------------------------------------------
# Utilidades
# -----------------------------------------------------------
def _norm(s: str) -> str:
    """Normaliza tildes y a minúsculas para comparar llaves ('Miércoles' -> 'miercoles')."""
    if not s:
        return ""
    s = s.lower()
    return (s.replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u"))

def _normalize_schedule_keys(schedule: dict) -> dict:
    """Normaliza las llaves de día y sección en el horario."""
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

#S|
def get_expected_schedule(schedule: dict, target_date: datetime):
    """Obtiene el horario de trabajo esperado para un día específico."""
    dias_semana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    dia_str = dias_semana[target_date.weekday()]
    
    schedule_n = _normalize_schedule_keys(schedule)
    dia_n = _norm(dia_str)
    
    expected_blocks = schedule_n.get(dia_n, {})
    
    # 🔹 Simplificar el retorno para el registro de inasistencia
    # Solo devolver bloques que tienen 'start' y 'end'
    simplified_schedule = {}
    for sec, data in expected_blocks.items():
        if data and data.get("start") and data.get("end"):
            simplified_schedule[sec] = data
            
    return dia_str, simplified_schedule

# -----------------------------------------------------------
# Lógica Principal
# -----------------------------------------------------------
def check_absences(target_date: datetime):
    """
    Busca inasistencias (ausencia de registro de entrada/salida)
    para la fecha objetivo.
    """
    target_date_str = target_date.strftime("%Y-%m-%d")
    print(f"Buscando inasistencias para la fecha: {target_date_str}...")

    # 🔹 1. Obtener todos los empleados (y coordinadores, si aplican)
    # Excluir Administradores ya que su acceso puede ser diferente o libre
    user_data = []
    
    # Empleados
    for user in employee_collection.find({"schedule": {"$exists": True, "$ne": {}}}):
        user_data.append({
            "id_Employee": str(user["_id"]),
            "names": user.get("names", "N/A"),
            "surnames": user.get("surnames", "N/A"),
            "schedule": user.get("schedule", {}),
            "employee_type": "Employee"
        })
        
    # Coordinadores (asumiendo que tienen un horario que deben cumplir)
    for user in coordinator_collection.find({"schedule": {"$exists": True, "$ne": {}}}):
        user_data.append({
            "id_Employee": str(user["_id"]),
            "names": user.get("names", "N/A"),
            "surnames": user.get("surnames", "N/A"),
            "schedule": user.get("schedule", {}),
            "employee_type": "Coordinator"
        })

    print(f"Total de usuarios con horario a verificar: {len(user_data)}")
    
    # 🔹 2. Iterar sobre cada usuario y verificar su horario/acceso
    for user in user_data:
        emp_id = user["id_Employee"]
        schedule = user["schedule"]
        
        dia_str, expected_schedule = get_expected_schedule(schedule, target_date)
        
        if not expected_schedule:
            # print(f" - {user['names']} {user['surnames']} ({emp_id}): Sin horario para el {dia_str}.")
            continue # No hay horario asignado para ese día

        # 🔹 3. Buscar el registro de acceso para ese usuario en la fecha
        access_record = access_collection.find_one({
            "id_Employee": emp_id,
            "date": target_date_str
        })
        
        # 🔹 4. Determinar el tipo de inasistencia
        is_missing_entry = False
        is_missing_exit = False
        
        for sec in expected_schedule:
            # Si hay horario (entrada/salida) para una sección, y NO hay registro en Mongo
            if "entry_time" not in access_record or access_record.get("entry_time") is None:
                is_missing_entry = True
            
            # Solo verificar salida si la entrada NO está en 'Salió antes' o 'Tarde' (o si el turno es largo)
            # Para simplificar, solo verificamos si el campo exit_time está o no en el registro.
            if "exit_time" not in access_record or access_record.get("exit_time") is None:
                is_missing_exit = True
            
            # Si ya encontramos una falta en cualquier bloque, salimos de la verificación de bloques
            if is_missing_entry or is_missing_exit:
                break
        
        
        reason = None
        if is_missing_entry and is_missing_exit:
            reason = "Ausencia total" # No hay registro de entrada ni de salida
        elif is_missing_entry:
            reason = "Ausencia de entrada" # Solo falta la entrada
        elif is_missing_exit:
            reason = "Ausencia de salida" # Solo falta la salida

        # 🔹 5. Registrar la inasistencia si aplica
        if reason:
            print(f"🚨 INASISTENCIA: {user['names']} {user['surnames']} - {reason} para el {target_date_str}")
            
            absence_payload = {
                "id_Employee": emp_id,
                "date": target_date_str,
                "reason": reason,
                "schedule_info": expected_schedule,
                "names": user["names"],
                "surnames": user["surnames"],
                "employee_type": user["employee_type"],
            }
            
            register_absence_via_api(absence_payload)


def register_absence_via_api(payload: dict):
    """
    Llama al endpoint de Flask para registrar la inasistencia.
    """
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(API_URL, json=payload, headers=headers)
        response.raise_for_status() # Lanza HTTPError si la respuesta es 4xx o 5xx
        print(f" ✓ Registro API exitoso. Status: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"ERROR al registrar inasistencia via API: {e}")
        try:
            print(f"    Respuesta del servidor: {response.text}")
        except:
            pass


# -----------------------------------------------------------
# Ejecución
# -----------------------------------------------------------
if __name__ == "__main__":
    # Obtener la fecha del día anterior (ideal para ejecutar a medianoche)
    yesterday = datetime.now().date() - timedelta(days=1)
    
    # Transformar a datetime para usar en la función
    target_date = datetime.combine(yesterday, datetime.min.time()) 
    
    check_absences(target_date)

    print("Proceso de verificación de inasistencias finalizado.")