from apscheduler.schedulers.background import BackgroundScheduler
from attendance_checker import check_absences
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def job_verificar_inasistencias():
    """Ejecuta la verificación del día anterior"""
    logger.info("Iniciando verificación de inasistencias programada...")
    try:
        yesterday = datetime.now().date() - timedelta(days=1)
        target_date = datetime.combine(yesterday, datetime.min.time())
        check_absences(target_date)
        logger.info("Verificación completada exitosamente")
    except Exception as e:
        logger.error(f"Error en verificación de inasistencias: {e}")

def iniciar_scheduler():
    """Inicia el scheduler en segundo plano"""
    scheduler = BackgroundScheduler(timezone='America/Mexico_City')
    
    # Ejecutar todos los días a las 00:00
    scheduler.add_job(
        job_verificar_inasistencias,
        trigger='cron',
        hour=0,
        minute=0,
        id='verificar_inasistencias',
        name='Verificación diaria de inasistencias'
    )
    
    scheduler.start()
    logger.info("Scheduler iniciado. Verificación programada para las 00:00 diariamente")
    
    return scheduler

if __name__ == "__main__":
    iniciar_scheduler()
    
    # Mantener el script corriendo
    import time
    try:
        while True:
            time.sleep(60)
    except (KeyboardInterrupt, SystemExit):
        pass