from dotenv import load_dotenv
import os

dotenv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env')
load_dotenv(dotenv_path)

PORT_MAPEO = int(os.getenv("PORT_MAPEO", 4500))
PORT_RECONOCIMIENTO = int(os.getenv("PORT_RECONOCIMIENTO", 4600))
PORT_HEALTH = int(os.getenv("PORT_HEALTH", 4700))

MAPEO_API_URL = f"http://localhost:{PORT_MAPEO}"
RECONOCIMIENTO_API_URL = f"http://localhost:{PORT_RECONOCIMIENTO}"
HEALTH_API_URL = f"http://localhost:{PORT_HEALTH}"

MAPEO_API_KEY = os.getenv("MAPEO_API_KEY")
RECONOCIMIENTO_API_KEY = os.getenv("RECONOCIMIENTO_API_KEY")
DB_URI = os.getenv("DB_URI")
