import requests
from datetime import datetime
import os
from dotenv import load_dotenv

# 🔹 Cargar variables de entorno
load_dotenv()
ACCESS_API_URL = "http://localhost:4800/api/access"
API_ACCESS_KEY = os.getenv("API_ACCESS_KEY")

# 🔹 Datos de prueba
# matched_id debe existir en tu base de datos (Employee, Coordinator o Admin)
matched_id = "68a3b9e5f3bd31cc48fbdafb"  # ID de ejemplo de MongoDB
foto_prueba_url = "https://via.placeholder.com/150"

# 🔹 Imprimir API Key y matched_id para debug
print("API Key usada:", API_ACCESS_KEY)
print("Usuario que vamos a registrar:", matched_id)

# 🔹 Forzar tipo de registro
tipo = "entrada"

# 🔹 Preparar payload
payload = {
    "id_Employee": matched_id,
    "date": datetime.now().date().isoformat(),
    "entry_time": datetime.now().isoformat(),
    "entry_photo": foto_prueba_url
}

# 🔹 Headers con API Key
headers = {
    "Authorization": f"Bearer {API_ACCESS_KEY}",
    "Content-Type": "application/json"
}

# 🔹 Enviar POST a la API
try:
    print("Enviando registro de acceso...")
    response = requests.post(ACCESS_API_URL, json=payload, headers=headers)
    print("Código HTTP:", response.status_code)
    print("Respuesta JSON:", response.json())
except Exception as e:
    print("Error al enviar la solicitud:", e)
