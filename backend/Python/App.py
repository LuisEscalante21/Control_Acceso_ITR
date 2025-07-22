from multiprocessing import Process
from Mapeo import iniciar_api_mapeo
from Reconocimiento import iniciar_api_reconocimiento
from Health import iniciar_api_health
from Connections import conectar_api_mapeo, conectar_api_reconocimiento, conectar_api_health
import time

def main():
    p_mapeo = Process(target=iniciar_api_mapeo)
    p_reconocimiento = Process(target=iniciar_api_reconocimiento)
    p_health = Process(target=iniciar_api_health)

    p_mapeo.start()
    p_reconocimiento.start()
    p_health.start()

    # Dar tiempo a que los servidores Flask arranquen antes de hacer requests
    time.sleep(5)

    print("Respuesta API Mapeo:", conectar_api_mapeo())
    print("Respuesta API Reconocimiento:", conectar_api_reconocimiento())
    print("Respuesta API Health:", conectar_api_health())

    p_mapeo.join()
    p_reconocimiento.join()
    p_health.join()

if __name__ == "__main__":
    main()
 