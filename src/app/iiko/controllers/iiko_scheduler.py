import requests
from app.database.database import SessionLocal
from app.database.schemas import LicenseIiko
from app.core.logger import logger, log_to_db
from app.core.config import settings

class IikoScheduler:
    API_URL = settings.IIKO_API_URL
    API_KEY = settings.IIKO_API_KEY

    @classmethod
    def update_licenses(cls):
        db = SessionLocal()
        try:
            headers = {
                "Accept": "*/*",
                "User-Agent": "IntegrationManager",
                "ApiKey": cls.API_KEY
            }
            response = requests.get(cls.API_URL, headers=headers)
            response.raise_for_status()
            data = response.json()

            db.query(LicenseIiko).delete()
            for item in data:
                db.add(LicenseIiko(data=item))
            db.commit()

            logger.info(f"iiko licenses synced ({len(data)} records)")
            log_to_db("INFO", f"Synced {len(data)} iiko licenses")

        except Exception as e:
            db.rollback()
            logger.error(f"Error syncing iiko licenses: {e}")
            log_to_db("ERROR", f"iiko sync failed: {e}")
        finally:
            db.close()
