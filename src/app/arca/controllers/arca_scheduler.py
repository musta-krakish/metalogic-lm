from app.arca.controllers.arca_controller import ArcaController
from app.core.logger import logger

class ArcaScheduler:
    @staticmethod
    def update_licenses():
        try:
            ArcaController.sync_licenses()
            logger.info("ARCA licenses updated successfully")
        except Exception as e:
            logger.error(f"Error updating ARCA licenses: {e}")
