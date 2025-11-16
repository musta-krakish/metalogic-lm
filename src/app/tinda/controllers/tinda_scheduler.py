from app.tinda.controllers.tinda_controller import TindaController
from app.core.logger import logger, log_to_db

class TindaScheduler:
    @classmethod
    def update_users(cls):
        try:
            TindaController.sync_users()
            logger.info("Tinda users updated successfully")
            log_to_db("INFO", "Tinda users updated")
        except Exception as e:
            logger.error(f"Error updating Tinda users: {e}")
            log_to_db("ERROR", f"Error updating Tinda users: {e}")
