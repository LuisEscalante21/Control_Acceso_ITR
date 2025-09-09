from multiprocessing import Process
from Connections import conectar_api_mapeo, conectar_api_reconocimiento, conectar_api_acceso
import time

def main():
    print("Iniciando APIs...")

    from Mapeo import iniciar_api_mapeo
    from Reconocimiento import iniciar_api_reconocimiento
    from Registro_acceso import iniciar_api_acceso

    p1 = Process(target=iniciar_api_mapeo)
    p2 = Process(target=iniciar_api_reconocimiento)
    p3 = Process(target=iniciar_api_acceso)

    p1.start()
    p2.start()
    p3.start()

    print("[INFO] Esperando a que las APIs estén listas...")
    time.sleep(3)  # Tiempo inicial antes de comenzar las conexiones

    def intentar_conectar(nombre, funcion_conectar):
        for intento in range(10):
            resultado = funcion_conectar()
            if resultado:
                print(f"[INFO] Respuesta de la API de {nombre}:", resultado)
                return
            print(f"[WARN] {nombre} aún no responde, reintentando ({intento+1}/10)...")
            time.sleep(1)
        print(f"[ERROR] No se pudo conectar a la API de {nombre} después de varios intentos.")

    intentar_conectar("mapeo", conectar_api_mapeo)
    intentar_conectar("reconocimiento", conectar_api_reconocimiento)
    intentar_conectar("acceso", conectar_api_acceso)

    print("[INFO] Todas las APIs están en ejecución. Esperando que terminen...")
    p1.join()
    p2.join()
    p3.join()

if __name__ == "__main__":
    main()