from multiprocessing import Process
from Connections import conectar_api_mapeo, conectar_api_reconocimiento
from Mapeo import iniciar_api_mapeo
from Reconocimiento import iniciar_api_reconocimiento

def main():
    print("Iniciando APIs...")
    p1 = Process(target=iniciar_api_mapeo)
    p2 = Process(target=iniciar_api_reconocimiento)
    p1.start()
    p2.start()
    print("[INFO] Conectando a las APIs...")

    mapeo_resultado = conectar_api_mapeo()
    if mapeo_resultado:
        print("[INFO] Respuesta de la API de mapeo:", mapeo_resultado)
    else:
        print("[ERROR] al conectar a la API de mapeo")

    reconocimiento_resultado = conectar_api_reconocimiento()
    if reconocimiento_resultado:
        print("[INFO] Respuesta de la API de reconocimiento:", reconocimiento_resultado)
    else:
        print("[ERROR]Error al conectar a la API de reconocimiento")

    p1.join()
    p2.join()

if __name__ == "__main__":
    main()