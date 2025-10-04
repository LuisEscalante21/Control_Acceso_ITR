from multiprocessing import Process
from Connections import conectar_api_mapeo, conectar_api_reconocimiento, conectar_api_acceso
from Scheduler import iniciar_scheduler 
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
    time.sleep(3)
    
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
    
    # Iniciar el scheduler de inasistencias
    print("[INFO] Iniciando scheduler de verificacion de inasistencias...")
    scheduler = iniciar_scheduler()
    print("[INFO] Scheduler activo. Las inasistencias se verificaran automaticamente a las 00:00")
    
    print("[INFO] Todas las APIs están en ejecucion. Esperando que terminen...")
    
    try:
        p1.join()
        p2.join()
        p3.join()
    except KeyboardInterrupt:
        print("\n[INFO] Deteniendo servicios...")
        if scheduler:
            scheduler.shutdown()
        p1.terminate()
        p2.terminate()
        p3.terminate()
        print("[INFO] Todos los servicios han sido detenidos.")

if __name__ == "__main__":
    main()