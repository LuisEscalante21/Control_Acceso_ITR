import requests
from Config import MAPEO_API_KEY, RECONOCIMIENTO_API_KEY, API_ACCESS_KEY, ENDPOINT_URL_TEST

def conectar_api_mapeo():
    try:
        headers = {"Authorization": f"Bearer {MAPEO_API_KEY}"}
        response = requests.get(ENDPOINT_URL_TEST, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error al conectar a la API de mapeo: {e}")
        return None

def conectar_api_reconocimiento():
    try:
        headers = {"Authorization": f"Bearer {RECONOCIMIENTO_API_KEY}"}
        response = requests.get(ENDPOINT_URL_TEST, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error al conectar a la API de reconocimiento: {e}")
        return None

def conectar_api_acceso():
    try:
        headers = {"Authorization": f"Bearer {API_ACCESS_KEY}"}
        response = requests.get(ENDPOINT_URL_TEST, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error al conectar a la API de acceso: {e}")
        return None
