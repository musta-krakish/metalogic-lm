from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from app.database.database import SessionLocal
from app.database.schemas import LogEntry
from app.core.logger import logger
from app.iiko.controllers.iiko_scheduler import IikoScheduler
from app.arca.controllers.arca_scheduler import ArcaScheduler
from app.tinda.controllers.tinda_scheduler import TindaScheduler
from app.tsd.controllers.tsd_scheduler import TsdScheduler
from app.kaspi.controllers.kaspi_controller import KaspiController

def cleanup_old_logs():
    """Удаляет логи старше 7 дней"""
    db = SessionLocal()
    week_ago = datetime.now() - timedelta(days=7)
    try:
        deleted = db.query(LogEntry).filter(LogEntry.created_at < week_ago).delete()
        db.commit()
        logger.info(f"Cleared {deleted} old log entries")
    except Exception as e:
        logger.error(f"Error cleaning logs: {e}")
    finally:
        db.close()
        
def update_iiko_licenses_job():
    logger.info("Обновление лицензий iiko...")
    IikoScheduler.update_licenses()

def update_arca_licenses_job():
    logger.info("Обновление лицензий arca...")
    ArcaScheduler.update_licenses()

def update_tinda_users_job():
    logger.info("Обновление пользователей tinda...")
    TindaScheduler.update_users()

def update_tsd_users_job():
    logger.info("Обновление пользователей tsd...")
    TsdScheduler.update_users()

def update_kaspi_users_job():
    logger.info("Обновление пользователей Kaspi...")
    KaspiController.sync_users()

scheduler = BackgroundScheduler()
scheduler.add_job(cleanup_old_logs, "interval", days=7)
scheduler.add_job(update_iiko_licenses_job, "interval", hours=1)
scheduler.add_job(update_arca_licenses_job, "interval", hours=1)
scheduler.add_job(update_tinda_users_job, "interval", hours=1)
scheduler.add_job(update_tsd_users_job, "interval", hours=1)
scheduler.add_job(update_kaspi_users_job, "interval", hours=1)

