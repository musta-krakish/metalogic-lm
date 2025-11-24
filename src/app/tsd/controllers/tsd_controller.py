import requests
from fastapi import HTTPException
from datetime import datetime
from app.database.database import SessionLocal
from app.database.schemas import TsdUser
from app.core.logger import logger, log_to_db
import pandas as pd
import io


class TsdController:
    BASE_URL = "https://bapi.4dev.kz/"
    USERNAME = "bridgeadmin"
    PASSWORD = "vbnJ456#"
    DEVICE_ID = "string"
    DEVICE_NAME = "string"
    ROLE = "string"

    @classmethod
    def _login(cls):
        url = f"{cls.BASE_URL}api/Auth/login"
        payload = {
            "username": cls.USERNAME,
            "password": cls.PASSWORD,
            "deviceID": cls.DEVICE_ID,
            "deviceName": cls.DEVICE_NAME,
            "role": cls.ROLE
        }
        try:
            resp = requests.post(url, json=payload)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"TSD login failed: {e}")
            log_to_db("ERROR", f"TSD login failed: {e}")
            raise HTTPException(status_code=500, detail="Ошибка авторизации в TSD")

    @classmethod
    def _headers(cls):
        token = cls._login()
        return {
            "Authorization": f"Bearer {token}"
        }

    # ----------------- USERS & SYNC -----------------

    @classmethod
    def sync_users(cls):
        db = SessionLocal()
        try:
            headers = cls._headers()
            url = f"{cls.BASE_URL}api/Admin/GetUsers"
            resp = requests.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()

            if not isinstance(data, list):
                logger.warning("TSD GetUsers returned non-list")
                data = []

            db.query(TsdUser).delete()
            for item in data:
                db.add(TsdUser(data=item))
            db.commit()

            logger.info(f"TSD users synced: {len(data)}")
            log_to_db("INFO", f"TSD users synced: {len(data)}")
        except Exception as e:
            db.rollback()
            logger.error(f"TSD sync failed: {e}")
            log_to_db("ERROR", f"TSD sync failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            db.close()

    @staticmethod
    def get_users():
        db = SessionLocal()
        try:
            rows = db.query(TsdUser).order_by(TsdUser.updated_at.desc()).all()
            return [r.data for r in rows]
        finally:
            db.close()

    @staticmethod
    def export_users_to_excel():
        db = SessionLocal()
        try:
            rows = db.query(TsdUser).all()
            data = [r.data for r in rows]

            if data:
                df = pd.DataFrame(data)
            else:
                df = pd.DataFrame()

            output = io.BytesIO()
            with pd.ExcelWriter(output, engine="openpyxl") as writer:
                df.to_excel(writer, sheet_name="TSDUsers", index=False)

            output.seek(0)
            filename = f"tsd_users_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            return output, filename
        finally:
            db.close()

    # ----------------- C.R.U.D Actions -----------------

    @classmethod
    def create_user(cls, payload: dict):
        url = f"{cls.BASE_URL}api/Auth/register"
        try:
            headers = cls._headers()
            resp = requests.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            log_to_db("INFO", f"TSD created user {payload.get('username')}")
            return data
        except Exception as e:
            logger.error(f"TSD create_user failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def set_pass(cls, username: str, password: str):
        url = f"{cls.BASE_URL}api/Auth/changePassword"
        params = {"username": username, "password": password}
        try:
            headers = cls._headers()
            resp = requests.patch(url, params=params, headers=headers)
            resp.raise_for_status()
            log_to_db("INFO", f"TSD changed password for {username}")
            return resp.json()
        except Exception as e:
            logger.error(f"TSD set_pass failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def set_device_count(cls, username: str, count: int):
        url = f"{cls.BASE_URL}api/Admin/SetDeviceCount"
        params = {"username": username, "countdevice": count}
        try:
            headers = cls._headers()
            resp = requests.patch(url, params=params, headers=headers)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"TSD set_device_count failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def set_bin(cls, username: str, bin_val: str):
        url = f"{cls.BASE_URL}api/Admin/SetBIN"
        params = {"username": username, "bin": bin_val}
        try:
            headers = cls._headers()
            resp = requests.patch(url, params=params, headers=headers)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"TSD set_bin failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def set_org(cls, username: str, org: str):
        url = f"{cls.BASE_URL}api/Admin/SetOrg"
        params = {"username": username, "org": org}
        try:
            headers = cls._headers()
            resp = requests.patch(url, params=params, headers=headers)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"TSD set_org failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def set_expire(cls, username: str, expire_date: str):
        """expire_date формат YYYY-MM-DDTHH:MM:SS"""
        url = f"{cls.BASE_URL}api/Admin/SetExpireDate"
        params = {"username": username, "expireDate": expire_date}
        try:
            headers = cls._headers()
            resp = requests.patch(url, params=params, headers=headers)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"TSD set_expire failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def get_user_detail(cls, username: str):
        url = f"{cls.BASE_URL}api/Admin/GetUserInfo"
        params = {"username": username}
        try:
            headers = cls._headers()
            resp = requests.get(url, params=params, headers=headers)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"TSD get_user_detail failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def delete_user(cls, username: str):
        url = f"{cls.BASE_URL}api/Admin/DeleteUser"
        params = {"username": username}
        try:
            headers = cls._headers()
            resp = requests.delete(url, params=params, headers=headers)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"TSD delete_user failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def active_user(cls, username: str):
        url = f"{cls.BASE_URL}api/Admin/SetActiveUser"
        params = {"username": username}
        try:
            headers = cls._headers()
            resp = requests.patch(url, params=params, headers=headers)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"TSD active_user failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))
