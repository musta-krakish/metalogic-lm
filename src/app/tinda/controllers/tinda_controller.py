import requests
from datetime import datetime
import io
import pandas as pd

from fastapi import HTTPException
from app.database.database import SessionLocal
from app.database.schemas import TindaUser
from app.core.logger import logger, log_to_db
from app.core.config import settings


class TindaController:
    BASE_URL = settings.TINDA_BASE_URL
    USERNAME = settings.TINDA_USERNAME
    PASSWORD = settings.TINDA_PASSWORD

    @classmethod
    def _get_token(cls) -> str:
        """Логинимся в Tinda и получаем JWT-токен."""
        url = f"{cls.BASE_URL}login"
        payload = {
            "username": cls.USERNAME,
            "password": cls.PASSWORD,
        }
        try:
            resp = requests.post(url, json=payload)
            resp.raise_for_status()
            token = resp.json() if isinstance(resp.json(), str) else resp.json().get("token")  # подстрахуемся
            if not token:
                raise ValueError("Tinda login: empty token")
            return token
        except Exception as e:
            logger.error(f"Tinda login failed: {e}")
            log_to_db("ERROR", f"Tinda login failed: {e}")
            raise HTTPException(status_code=500, detail="Ошибка авторизации в Tinda")

    @classmethod
    def _get_headers(cls) -> dict:
        token = cls._get_token()
        return {
            "Authorization": f"Bearer {token}"
        }

    # ------- СИНХРОНИЗАЦИЯ / ЧТЕНИЕ -------

    @classmethod
    def sync_users(cls):
        """Подтянуть всех пользователей из Tinda и сохранить в БД."""
        db = SessionLocal()
        try:
            headers = cls._get_headers()
            url = f"{cls.BASE_URL}Admin/GetUsers"
            resp = requests.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()

            # Ожидаем, что data — список пользователей
            if not isinstance(data, list):
                logger.warning("Tinda GetUsers returned non-list response")
                data = []

            db.query(TindaUser).delete()
            for item in data:
                db.add(TindaUser(data=item))
            db.commit()

            logger.info(f"Tinda users synced ({len(data)} records)")
            log_to_db("INFO", f"Tinda users synced ({len(data)} records)")
        except Exception as e:
            db.rollback()
            logger.error(f"Tinda sync failed: {e}")
            log_to_db("ERROR", f"Tinda sync failed: {e}")
            raise HTTPException(status_code=500, detail="Ошибка синхронизации пользователей Tinda")
        finally:
            db.close()

    @staticmethod
    def get_users():
        """Вернуть пользователей из локальной БД."""
        db = SessionLocal()
        try:
            rows = db.query(TindaUser).order_by(TindaUser.updated_at.desc()).all()
            return [r.data for r in rows]
        finally:
            db.close()

    @staticmethod
    def export_users_to_excel():
        """Выгрузить пользователей Tinda в Excel"""
        db = SessionLocal()
        try:
            rows = db.query(TindaUser).order_by(TindaUser.updated_at.desc()).all()
            data = [r.data for r in rows]

            if data:
                df = pd.DataFrame(data)
            else:
                df = pd.DataFrame()

            output = io.BytesIO()
            with pd.ExcelWriter(output, engine="openpyxl") as writer:
                df.to_excel(writer, sheet_name="TindaUsers", index=False)

            output.seek(0)
            filename = f"tinda_users_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            return output, filename
        finally:
            db.close()

    # ------- ОПЕРАЦИИ С ПОЛЬЗОВАТЕЛЯМИ -------

    @classmethod
    def create_user(cls, payload: dict):
        try:
            headers = cls._get_headers()
            url = f"{cls.BASE_URL}Register"
            resp = requests.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            log_to_db("INFO", f"Created Tinda user: {payload.get('username')}")
            return data
        except Exception as e:
            logger.error(f"Tinda create_user failed: {e}")
            log_to_db("ERROR", f"Tinda create_user failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def set_org(cls, user_id: int, org: str):
        try:
            headers = cls._get_headers()
            url = f"{cls.BASE_URL}Admin/SetOrg/{user_id}"
            params = {"Org": org}
            resp = requests.patch(url, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            log_to_db("INFO", f"Tinda set_org for user {user_id} -> {org}")
            return data
        except Exception as e:
            logger.error(f"Tinda set_org failed: {e}")
            log_to_db("ERROR", f"Tinda set_org failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def set_active(cls, user_id: int):
        try:
            headers = cls._get_headers()
            url = f"{cls.BASE_URL}Admin/SetActive/{user_id}"
            resp = requests.patch(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            log_to_db("INFO", f"Tinda set_active for user {user_id}")
            return data
        except Exception as e:
            logger.error(f"Tinda set_active failed: {e}")
            log_to_db("ERROR", f"Tinda set_active failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def set_bin(cls, user_id: int, bin_value: str):
        try:
            headers = cls._get_headers()
            url = f"{cls.BASE_URL}Admin/SetBIN/{user_id}"
            params = {"bin": bin_value}
            resp = requests.patch(url, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            log_to_db("INFO", f"Tinda set_bin for user {user_id} -> {bin_value}")
            return data
        except Exception as e:
            logger.error(f"Tinda set_bin failed: {e}")
            log_to_db("ERROR", f"Tinda set_bin failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def set_expire_date(cls, user_id: int, expire_date: str):
        try:
            headers = cls._get_headers()
            url = f"{cls.BASE_URL}Admin/SetExpireDate/{user_id}&date={expire_date}"
            resp = requests.patch(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            log_to_db("INFO", f"Tinda set_expire_date for user {user_id} -> {expire_date}")
            return data
        except Exception as e:
            logger.error(f"Tinda set_expire_date failed: {e}")
            log_to_db("ERROR", f"Tinda set_expire_date failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))
