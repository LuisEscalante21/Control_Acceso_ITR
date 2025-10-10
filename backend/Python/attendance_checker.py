import os
import requests
from pymongo import MongoClient
from datetime import datetime, timedelta
from dotenv import load_dotenv
from bson import ObjectId

# -----------------------------------------------------------
# Cargar variables de entorno
# -----------------------------------------------------------
load_dotenv()

MONGO_URI = os.getenv("DB_URI")
DB_NAME = os.getenv("DB_NAME")
API_URL = "http://localhost:4000/api/absences"
API_KEY = os.getenv("API_ACCESS_KEY")

EMPLOYEE_COLLECTION_NAME = "employees"
ACCESS_COLLECTION_NAME = "registrationAccess"
COORDINATOR_COLLECTION_NAME = "coordinators"
PERMISSIONS_COLLECTION_NAME = "permissions"

# -----------------------------------------------------------
# Conexión a MongoDB
# -----------------------------------------------------------
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
    if not s:
        return ""
    s = s.lower()
    return (
        s.replace("á", "a")
        .replace("é", "e")
        .replace("í", "i")
        .replace("ó", "o")
        .replace("ú", "u")
    )


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


def get_expected_schedule(schedule: dict, target_date: datetime):
    dias_semana = [
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
        "Domingo",
    ]
    dia_str = dias_semana[target_date.weekday()]
    schedule_n = _normalize_schedule_keys(schedule)
    dia_n = _norm(dia_str)
    expected_blocks = schedule_n.get(dia_n, {})
    simplified_schedule = {}
    for sec, data in expected_blocks.items():
        if data and data.get("start") and data.get("end"):
            simplified_schedule[sec] = data
    return dia_str, simplified_schedule


# -----------------------------------------------------------
# Verificar si hay permiso aprobado
# -----------------------------------------------------------
def has_approved_permission(user_id: str, target_date: datetime) -> dict:
    target_date_str = target_date.strftime("%Y-%m-%d")
    permissions = permissions_collection.find({"idUser": user_id, "status": "approved"})
    for perm in permissions:
        perm_type = perm.get("permissionType")

        # Permiso menor
        if perm_type == "minor":
            perm_date = perm.get("permissionDate")
            if perm_date and perm_date == target_date_str:
                return {
                    "has_permission": True,
                    "permission_type": "Permiso menor (horas)",
                    "reason": perm.get("reason", "Permiso aprobado"),
                    "details": f"De {perm.get('startTime')} a {perm.get('endTime')}",
                }

        # Permiso mayor
        elif perm_type == "major":
            date_from = perm.get("permissionDateFrom")
            date_to = perm.get("permissionDateTo")
            if date_from and date_to:
                from_dt = datetime.strptime(date_from, "%Y-%m-%d")
                to_dt = datetime.strptime(date_to, "%Y-%m-%d")
                if from_dt.date() <= target_date.date() <= to_dt.date():
                    return {
                        "has_permission": True,
                        "permission_type": "Permiso mayor",
                        "reason": perm.get("reason", "Permiso aprobado"),
                        "details": f"Del {date_from} al {date_to}",
                    }

        # Incapacidad médica
        elif perm_type == "incapacity":
            date_from = perm.get("sickLeaveDateFrom")
            date_to = perm.get("sickLeaveDateTo")
            if date_from and date_to:
                from_dt = datetime.strptime(date_from, "%Y-%m-%d")
                to_dt = datetime.strptime(date_to, "%Y-%m-%d")
                if from_dt.date() <= target_date.date() <= to_dt.date():
                    return {
                        "has_permission": True,
                        "permission_type": "Incapacidad médica",
                        "reason": perm.get("illnessType", "Incapacidad médica"),
                        "details": f"Del {date_from} al {date_to}",
                    }

    return {"has_permission": False}


# -----------------------------------------------------------
# Registrar inasistencias
# -----------------------------------------------------------
def check_absences(target_date: datetime):
    target_date_str = target_date.strftime("%Y-%m-%d")
    print(f"\n{'='*60}")
    print(f"Buscando inasistencias para la fecha: {target_date_str}")
    print(f"{'='*60}\n")

    user_data = []
    for user in employee_collection.find({"schedule": {"$exists": True, "$ne": {}}}):
        user_data.append({
            "id_Employee": str(user["_id"]),
            "names": user.get("names", "N/A"),
            "surnames": user.get("surnames", "N/A"),
            "schedule": user.get("schedule", {}),
            "employee_type": "Employee",
            "idTeam": user.get("id_team"),
        })
    for user in coordinator_collection.find({"schedule": {"$exists": True, "$ne": {}}}):
        user_data.append({
            "id_Employee": str(user["_id"]),
            "names": user.get("names", "N/A"),
            "surnames": user.get("surnames", "N/A"),
            "schedule": user.get("schedule", {}),
            "employee_type": "Coordinator",
            "idTeam": user.get("id_team"),
        })

    print(f"Total de usuarios con horario a verificar: {len(user_data)}\n")

    total_absences = 0
    total_with_permission = 0
    total_checked = 0

    for user in user_data:
        emp_id = user["id_Employee"]
        full_name = f"{user['names']} {user['surnames']}"
        schedule = user["schedule"]
        dia_str, expected_schedule = get_expected_schedule(schedule, target_date)

        if not expected_schedule:
            continue

        total_checked += 1
        permission_check = has_approved_permission(emp_id, target_date)
        status = "pendiente"

        if permission_check["has_permission"]:
            total_with_permission += 1
            print(f"{full_name} ({emp_id})")
            print(f"Tiene permiso aprobado: {permission_check['permission_type']}")
            print(f"Motivo: {permission_check['reason']}")
            print(f"{permission_check['details']}")
            print(f"La inasistencia se marcará como CON PERMISO.\n")
            status = "con permiso"

        access_record = access_collection.find_one({"id_Employee": emp_id, "date": target_date_str})
        is_missing_entry = not access_record or not access_record.get("entry_time")
        is_missing_exit = not access_record or not access_record.get("exit_time")

        reason = None
        if is_missing_entry and is_missing_exit:
            reason = "Ausencia total"
        elif is_missing_entry:
            reason = "Ausencia de entrada"
        elif is_missing_exit:
            reason = "Ausencia de salida"

        if reason:
            total_absences += 1
            print(f"INASISTENCIA: {full_name}")
            print(f"Tipo: {reason}")
            print(f"Fecha: {target_date_str}")
            print(f"Estado: {status}\n")

            absence_payload = {
                "id_Employee": emp_id,
                "date": target_date_str,
                "reason": reason,
                "schedule_info": expected_schedule,
                "names": user["names"],
                "surnames": user["surnames"],
                "employee_type": user["employee_type"],
                "idTeam": user.get("idTeam"),
                "status": status,
            }

            register_absence_via_api(absence_payload)

    print(f"\n{'='*60}")
    print(f"RESUMEN DE VERIFICACIÓN")
    print(f"{'='*60}")
    print(f"Empleados verificados con horario: {total_checked}")
    print(f"Con permiso aprobado: {total_with_permission}")
    print(f"Inasistencias registradas: {total_absences}")
    print(f"{'='*60}\n")


# -----------------------------------------------------------
# Registrar en API
# -----------------------------------------------------------
def register_absence_via_api(payload: dict):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
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
# Ejecución principal
# -----------------------------------------------------------
if __name__ == "__main__":
    yesterday = datetime.now().date() - timedelta(days=1)
    target_date = datetime.combine(yesterday, datetime.min.time())
    check_absences(target_date)
    print("Proceso de verificación de inasistencias finalizado.")
