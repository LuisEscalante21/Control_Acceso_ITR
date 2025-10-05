import os
import requests
from pymongo import MongoClient
from datetime import datetime, timedelta
from dotenv import load_dotenv
from bson import ObjectId

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
COORDINATOR_COLLECTION_NAME = "coordinators"
ADMIN_COLLECTION_NAME = "administrators"
PERMISSIONS_COLLECTION_NAME = "permissions" 

# Conexión a MongoDB
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
employee_collection = db[EMPLOYEE_COLLECTION_NAME]
access_collection = db[ACCESS_COLLECTION_NAME]
coordinator_collection = db[COORDINATOR_COLLECTION_NAME]
permissions_collection = db[PERMISSIONS_COLLECTION_NAME]  

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

def get_expected_schedule(schedule: dict, target_date: datetime):
    """Obtiene el horario de trabajo esperado para un día específico."""
    dias_semana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    dia_str = dias_semana[target_date.weekday()]
    
    schedule_n = _normalize_schedule_keys(schedule)
    dia_n = _norm(dia_str)
    
    expected_blocks = schedule_n.get(dia_n, {})
    
    # Solo devolver bloques que tienen 'start' y 'end'
    simplified_schedule = {}
    for sec, data in expected_blocks.items():
        if data and data.get("start") and data.get("end"):
            simplified_schedule[sec] = data
            
    return dia_str, simplified_schedule

# -----------------------------------------------------------
# FUNCIÓN: Verificar si hay permiso aprobado
# -----------------------------------------------------------
def has_approved_permission(user_id: str, target_date: datetime) -> dict:
    """
    Verifica si el usuario tiene un permiso APROBADO que cubra la fecha objetivo.
    Consulta directamente MongoDB por eficiencia.
    Retorna: {"has_permission": bool, "permission_type": str, "reason": str}
    """
    target_date_str = target_date.strftime("%Y-%m-%d")
    
    # Consulta directa a MongoDB
    permissions = permissions_collection.find({
        "idUser": user_id,
        "status": "approved"
    })
    
    for perm in permissions:
        perm_type = perm.get("permissionType")
        
        # Permiso menor (horas específicas en un día)
        if perm_type == "minor":
            perm_date = perm.get("permissionDate")
            if perm_date and perm_date == target_date_str:
                return {
                    "has_permission": True,
                    "permission_type": "Permiso menor (horas)",
                    "reason": perm.get("reason", "Permiso aprobado"),
                    "details": f"De {perm.get('startTime')} a {perm.get('endTime')}"
                }
        
        # Permiso mayor (días completos)
        elif perm_type == "major":
            date_from = perm.get("permissionDateFrom")
            date_to = perm.get("permissionDateTo")
            
            if date_from and date_to:
                try:
                    from_dt = datetime.strptime(date_from, "%Y-%m-%d")
                    to_dt = datetime.strptime(date_to, "%Y-%m-%d")
                    
                    if from_dt.date() <= target_date.date() <= to_dt.date():
                        return {
                            "has_permission": True,
                            "permission_type": "Permiso mayor",
                            "reason": perm.get("reason", "Permiso aprobado"),
                            "details": f"Del {date_from} al {date_to}"
                        }
                except ValueError:
                    continue
        
        # Incapacidad (días completos)
        elif perm_type == "incapacity":
            date_from = perm.get("sickLeaveDateFrom")
            date_to = perm.get("sickLeaveDateTo")
            
            if date_from and date_to:
                try:
                    from_dt = datetime.strptime(date_from, "%Y-%m-%d")
                    to_dt = datetime.strptime(date_to, "%Y-%m-%d")
                    
                    if from_dt.date() <= target_date.date() <= to_dt.date():
                        return {
                            "has_permission": True,
                            "permission_type": "Incapacidad",
                            "reason": perm.get("illnessType", "Incapacidad médica"),
                            "details": f"Del {date_from} al {date_to}"
                        }
                except ValueError:
                    continue
    
    return {"has_permission": False}

# -----------------------------------------------------------
# Lógica Principal
# -----------------------------------------------------------
def check_absences(target_date: datetime):
    """
    Busca inasistencias (ausencia de registro de entrada/salida)
    para la fecha objetivo, EXCLUYENDO empleados con permisos aprobados.
    """
    target_date_str = target_date.strftime("%Y-%m-%d")
    print(f"\n{'='*60}")
    print(f"Buscando inasistencias para la fecha: {target_date_str}")
    print(f"{'='*60}\n")

    # Obtener todos los empleados (y coordinadores)
    user_data = []
    
    # Empleados
    for user in employee_collection.find({"schedule": {"$exists": True, "$ne": {}}}):
        user_data.append({
            "id_Employee": str(user["_id"]),
            "names": user.get("names", "N/A"),
            "surnames": user.get("surnames", "N/A"),
            "schedule": user.get("schedule", {}),
            "employee_type": "Employee",
            "idTeam": user.get("id_team", None)  # Lee id_team de MongoDB
        })
        
    # Coordinadores
    for user in coordinator_collection.find({"schedule": {"$exists": True, "$ne": {}}}):
        user_data.append({
            "id_Employee": str(user["_id"]),
            "names": user.get("names", "N/A"),
            "surnames": user.get("surnames", "N/A"),
            "schedule": user.get("schedule", {}),
            "employee_type": "Coordinator",
            "idTeam": user.get("id_team", None)  # Lee id_team de MongoDB
        })

    print(f"Total de usuarios con horario a verificar: {len(user_data)}\n")
    
    # Contadores
    total_absences = 0
    total_with_permission = 0
    total_checked = 0
    
    # Iterar sobre cada usuario
    for user in user_data:
        emp_id = user["id_Employee"]
        schedule = user["schedule"]
        full_name = f"{user['names']} {user['surnames']}"
        
        dia_str, expected_schedule = get_expected_schedule(schedule, target_date)
        
        if not expected_schedule:
            continue  # No hay horario asignado para ese día
        
        total_checked += 1

        # VERIFICAR SI HAY PERMISO APROBADO
        permission_check = has_approved_permission(emp_id, target_date)
        
        if permission_check["has_permission"]:
            total_with_permission += 1
            print(f"{full_name} ({emp_id})")
            print(f"Tiene permiso aprobado: {permission_check['permission_type']}")
            print(f"Motivo: {permission_check['reason']}")
            print(f"{permission_check['details']}")
            print(f"NO se marca como inasistencia\n")
            continue  # Saltar, no marcar inasistencia

        # Buscar el registro de acceso
        access_record = access_collection.find_one({
            "id_Employee": emp_id,
            "date": target_date_str
        })
        
        # Determinar el tipo de inasistencia
        is_missing_entry = False
        is_missing_exit = False
        
        if not access_record or "entry_time" not in access_record or access_record.get("entry_time") is None:
            is_missing_entry = True
        
        if not access_record or "exit_time" not in access_record or access_record.get("exit_time") is None:
            is_missing_exit = True
        
        reason = None
        if is_missing_entry and is_missing_exit:
            reason = "Ausencia total"
        elif is_missing_entry:
            reason = "Ausencia de entrada"
        elif is_missing_exit:
            reason = "Ausencia de salida"

        # Registrar la inasistencia si aplica
        if reason:
            total_absences += 1
            print(f"INASISTENCIA: {full_name}")
            print(f"Tipo: {reason}")
            print(f"Fecha: {target_date_str}")
            print(f"Equipo: {user.get('idTeam') or 'No asignado'}")
            print(f"Horario esperado: {expected_schedule}\n")
            
            absence_payload = {
                "id_Employee": emp_id,
                "date": target_date_str,
                "reason": reason,
                "schedule_info": expected_schedule,
                "names": user["names"],
                "surnames": user["surnames"],
                "employee_type": user["employee_type"],
                "idTeam": user.get("idTeam")  # Envía idTeam al API
            }
            
            register_absence_via_api(absence_payload)
    
    print(f"\n{'='*60}")
    print(f"RESUMEN DE VERIFICACIÓN")
    print(f"{'='*60}")
    print(f"Empleados verificados con horario: {total_checked}")
    print(f"Con permiso aprobado (exentos): {total_with_permission}")
    print(f"Inasistencias registradas: {total_absences}")
    print(f"{'='*60}\n")


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
        response.raise_for_status()
        print(f"Registro API exitoso. Status: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"ERROR al registrar inasistencia via API: {e}")
        try:
            print(f"      Respuesta del servidor: {response.text}")
        except:
            pass

# -----------------------------------------------------------
# Ejecución
# -----------------------------------------------------------
if __name__ == "__main__":
    # Obtener la fecha del día anterior
    yesterday = datetime.now().date() - timedelta(days=1)
    target_date = datetime.combine(yesterday, datetime.min.time()) 
    
    check_absences(target_date)
    
    print("Proceso de verificación de inasistencias finalizado.")