import requests
from fastapi import HTTPException
from sqlalchemy import text
from app.database.database import SessionLocal
from app.database.schemas import LicenseArca
from app.core.logger import logger, log_to_db
from datetime import datetime
import pandas as pd
import io

class ArcaController:
    BASE_URL = "https://license.4dev.kz/"
    BASIC_USERNAME = "Nur"
    BASIC_PASSWORD = "Arman"

    @staticmethod
    def _auth():
        return (ArcaController.BASIC_USERNAME, ArcaController.BASIC_PASSWORD)

    @classmethod
    def sync_licenses(cls):
        """Подгрузить все лицензии из ARCA и сохранить в БД."""
        db = SessionLocal()
        try:
            response = requests.get(f"{cls.BASE_URL}allLicences", auth=cls._auth())
            response.raise_for_status()
            data = response.json().get("details", [])

            db.query(LicenseArca).delete()
            for item in data:
                db.add(LicenseArca(data=item))
            db.commit()

            logger.info(f"Synced {len(data)} ARCA licenses")
            log_to_db("INFO", f"Synced {len(data)} ARCA licenses")
        except Exception as e:
            db.rollback()
            logger.error(f"ARCA sync failed: {e}")
            log_to_db("ERROR", f"ARCA sync failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            db.close()

    @staticmethod
    def get_licenses():
        db = SessionLocal()
        try:
            licenses = db.query(LicenseArca).order_by(LicenseArca.updated_at.desc()).all()
            return [l.data for l in licenses]
        finally:
            db.close()

    @staticmethod
    def export_licenses_to_excel():
        db = SessionLocal()
        try:
            licenses = db.query(LicenseArca).all()
            data = [l.data for l in licenses]

            df = pd.DataFrame(data)
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine="openpyxl") as writer:
                df.to_excel(writer, sheet_name="ARCA", index=False)
            output.seek(0)

            filename = f"arca_licenses_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            return output, filename
        finally:
            db.close()

    @classmethod
    def create_license(cls, mac, key, date):
        url = f"{cls.BASE_URL}createLicences"
        params = {
            "mac_address": mac,
            "license_key": key,
            "license_date": date
        }
        try:
            resp = requests.post(url, params=params, auth=cls._auth())
            resp.raise_for_status()
            log_to_db("INFO", f"Created ARCA license {mac}")
            return resp.json()
        except Exception as e:
            logger.error(f"Ошибка создания лицензии ARCA: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def delete_license(cls, mac):
        url = f"{cls.BASE_URL}unreqisterLicense"
        try:
            resp = requests.get(url, params={"maccadress": mac}, auth=cls._auth())
            resp.raise_for_status()
            log_to_db("INFO", f"Deleted ARCA license {mac}")
            return resp.json()
        except Exception as e:
            logger.error(f"Ошибка удаления лицензии ARCA: {e}")
            raise HTTPException(status_code=500, detail=str(e))
