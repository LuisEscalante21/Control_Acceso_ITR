import requests
from Config import MAPEO_API_KEY, RECONOCIMIENTO_API_KEY, MAPEO_API_URL, RECONOCIMIENTO_API_URL, HEALTH_API_URL

def conectar_api_mapeo():
    try:
        url = f"{MAPEO_API_URL}/health"
        headers = {"Authorization": f"Bearer {MAPEO_API_KEY}"}
        r = requests.get(url, headers=headers)
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        print(f"Error al conectar a la API de mapeo: {e}")
        return None

def conectar_api_reconocimiento():
    try:
        url = f"{RECONOCIMIENTO_API_URL}/health"
        headers = {"Authorization": f"Bearer {RECONOCIMIENTO_API_KEY}"}
        r = requests.get(url, headers=headers)
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        print(f"Error al conectar a la API de reconocimiento: {e}")
        return None

def conectar_api_health():
    try:
        url = f"{HEALTH_API_URL}/health"
        r = requests.get(url)
        r.raise_for_status()
        return r.json()
    except requests.RequestException as e:
        print(f"Error al conectar a la API de health: {e}")
        return None
