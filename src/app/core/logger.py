import logging
from app.database.database import SessionLocal
from app.database.schemas import LogEntry

logger = logging.getLogger("app_logger")
logger.setLevel(logging.INFO)

console_handler = logging.StreamHandler()
console_handler.setFormatter(logging.Formatter("[%(asctime)s] [%(levelname)s] %(message)s"))
logger.addHandler(console_handler)

def log_to_db(level: str, message: str, path: str = None, method: str = None):
    db = SessionLocal()
    try:
        entry = LogEntry(level=level, message=message, path=path, method=method)
        db.add(entry)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to log to DB: {e}")
    finally:
        db.close()