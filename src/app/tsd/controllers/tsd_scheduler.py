from app.tsd.controllers.tsd_controller import TsdController
from app.core.logger import logger, log_to_db

class TsdScheduler:
    @classmethod
    def update_users(cls):
        try:
            TsdController.sync_users()
            logger.info("TSD users updated")
            log_to_db("INFO", "TSD users updated")
        except Exception as e:
            logger.error(f"TSD scheduler failed: {e}")
            log_to_db("ERROR", f"TSD scheduler failed: {e}")
