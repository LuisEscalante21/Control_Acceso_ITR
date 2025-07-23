from dotenv import load_dotenv
import os

dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
print("Ruta del archivo .env (absoluta):", os.path.abspath(dotenv_path))

if load_dotenv(dotenv_path):
    print("El archivo .env se ha cargado correctamente.")
else:
    print("Hubo un problema al cargar el archivo .env.")

MAPEO_API_URL = os.getenv("MAPEO_API_URL")
MAPEO_API_KEY = os.getenv("MAPEO_API_KEY")
RECONOCIMIENTO_API_URL = os.getenv("RECONOCIMIENTO_API_URL")
RECONOCIMIENTO_API_KEY = os.getenv("RECONOCIMIENTO_API_KEY")
DB_URI = os.getenv("DB_URI")

PORT_MAPEO = int(os.getenv("PORT_MAPEO", "4500"))
PORT_RECONOCIMIENTO = int(os.getenv("PORT_RECONOCIMIENTO", "4600"))

ENDPOINT_URL_TEST = os.getenv("ENDPOINT_URL_TEST") 

print("MAPEO_API_URL:", MAPEO_API_URL)
print("RECONOCIMIENTO_API_URL:", RECONOCIMIENTO_API_URL)
print("PORT_MAPEO:", PORT_MAPEO)
print("PORT_RECONOCIMIENTO:", PORT_RECONOCIMIENTO)