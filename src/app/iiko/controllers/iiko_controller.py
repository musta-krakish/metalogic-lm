import requests
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.database.schemas import LicenseIiko
from app.core.logger import logger, log_to_db

class IikoController:
    API_URL = "https://api.lm.gosu.kz/license"
    API_KEY = "liErLyguNEOLOwPOLINIteRFloGAgEackWaRSONiaHLocrECTa"

    @staticmethod
    def get_licenses(page: int = 1, limit: int = 10):
        db = SessionLocal()
        try:
            total = db.query(LicenseIiko).count()
            licenses = (
                db.query(LicenseIiko)
                .order_by(LicenseIiko.updated_at.desc())
                .offset((page - 1) * limit)
                .limit(limit)
                .all()
            )
            result = [l.data for l in licenses]
            return {
                "page": page,
                "limit": limit,
                "total": total,
                "items": result,
            }
        finally:
            db.close()

    @classmethod
    def create_license(cls, uid: str, title: str, count: int = 1,
                       product_name: str = "iiko", product_sub_name: str = "GosuCashRegisterPlugin"):
        try:
            payload = {
                "uid": uid,
                "title": title,
                "count": count,
                "product_name": product_name,
                "product_sub_name": product_sub_name
            }
            headers = {
                "Accept": "*/*",
                "Content-Type": "application/json",
                "ApiKey": cls.API_KEY
            }
            url = f"{cls.API_URL}/{uid}"
            resp = requests.patch(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            log_to_db("INFO", f"Created iiko license for {uid}")
            return data
        except Exception as e:
            logger.error(f"Ошибка создания лицензии: {e}")
            log_to_db("ERROR", f"Failed to create iiko license: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def verify_license(cls, license_code: str, ap_uid: str = "-", ap_online: bool = False,
                       deviceid=None, device_name=None, datetime=None, request=None, responce=None, error=None):
        try:
            payload = {
                "license": license_code,
                "ap_uid": ap_uid,
                "ap_online": ap_online,
                "deviceid": deviceid,
                "device_name": device_name,
                "datetime": datetime,
                "request": request,
                "responce": responce,
                "error": error
            }
            headers = {
                "Accept": "*/*",
                "Content-Type": "application/json",
                "ApiKey": cls.API_KEY
            }
            resp = requests.post(cls.API_URL, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            log_to_db("INFO", f"Verified iiko license {license_code[:12]}...")
            return data
        except Exception as e:
            logger.error(f"Ошибка проверки лицензии: {e}")
            log_to_db("ERROR", f"Failed to verify license: {e}")
            raise HTTPException(status_code=500, detail=str(e))
