import requests
from fastapi import HTTPException
from sqlalchemy import text, func, or_, cast, Boolean
from datetime import datetime
import pandas as pd
import io

from app.database.database import SessionLocal
from app.database.schemas import TsdUser
from app.core.logger import logger, log_to_db
from app.core.config import settings


class TsdController:
    BASE_URL = settings.TSD_BASE_URL
    USERNAME = settings.TSD_USERNAME
    PASSWORD = settings.TSD_PASSWORD
    DEVICE_ID = settings.TSD_DEVICE_ID
    DEVICE_NAME = settings.TSD_DEVICE_NAME
    ROLE = settings.TSD_ROLE

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
            token = resp.text.strip().replace('"', '')
            return token
        except Exception as e:
            logger.error(f"TSD login failed: {e}")
            log_to_db("ERROR", f"TSD login failed: {e}")
            raise HTTPException(status_code=500, detail="Ошибка авторизации в TSD")

    @classmethod
    def _headers(cls):
        token = cls._login()
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    @staticmethod
    def _build_filtered_query(db, search: str | None = None,
                              status: str | None = None,
                              org: str | None = None,
                              bin_value: str | None = None):
        query = db.query(TsdUser)

        if search:
            pattern = f"%{search.lower()}%"
            search_condition = or_(
                func.lower(text("data->>'username'")).like(pattern),
                func.lower(text("data->>'org'")).like(pattern),
                func.lower(text("data->>'bin'")).like(pattern),
            )
            query = query.filter(search_condition)

        if status and status != "all":
            is_active_field = TsdUser.data.op('->>')('isActive')

            if status == "active":
                query = query.filter(cast(is_active_field, Boolean).is_(True))
            elif status == "inactive":
                query = query.filter(cast(is_active_field, Boolean).is_(False))

        if org:
            org_pattern = f"%{org.lower()}%"
            org_condition = text("LOWER(data->>'org') LIKE :org_pattern").bindparams(org_pattern=org_pattern)
            query = query.filter(org_condition)

        if bin_value:
            bin_pattern = f"%{bin_value}%"
            bin_condition = text("data->>'bin' LIKE :bin_pattern").bindparams(bin_pattern=bin_pattern)
            query = query.filter(bin_condition)

        return query


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
    def get_users(
            page: int = 1,
            limit: int = 50,
            search: str | None = None,
            status: str | None = None,
            org: str | None = None,
            bin_value: str | None = None,
    ):
        db = SessionLocal()
        try:
            query = TsdController._build_filtered_query(
                db, search, status, org, bin_value
            )
            total = query.count()
            query = query.order_by(TsdUser.updated_at.desc())
            users = (
                query.offset((page - 1) * limit)
                .limit(limit)
                .all()
            )
            items = [r.data for r in users]
            return {"page": page, "limit": limit, "total": total, "items": items}
        finally:
            db.close()

    @staticmethod
    def export_users_to_excel(search=None, status=None, org=None, bin_value=None):
        db = SessionLocal()
        try:
            query = TsdController._build_filtered_query(db, search, status, org, bin_value)
            query = query.order_by(TsdUser.updated_at.desc())
            users = query.all()

            rows = []
            for u in users:
                item = u.data
                expire_raw = item.get("expireDate", "")
                expire_formatted = expire_raw
                if expire_raw:
                    try:
                        dt = datetime.fromisoformat(expire_raw)
                        expire_formatted = dt.strftime("%d.%m.%Y %H:%M")
                    except Exception:
                        pass

                rows.append({
                    "Username": item.get("username", ""),
                    "Organization": item.get("org", ""),
                    "BIN": item.get("bin", ""),
                    "Role": item.get("role", ""),
                    "Devices": item.get("availableDeviceCount", ""),
                    "Status": "Active" if item.get("isActive") else "Inactive",
                    "Registered": item.get("registerDate", ""),
                    "Expires": expire_formatted
                })

            df = pd.DataFrame(rows) if rows else pd.DataFrame()
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine="openpyxl") as writer:
                df.to_excel(writer, sheet_name="TSDUsers", index=False)
            output.seek(0)
            filename = f"tsd_users_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            return output, filename
        finally:
            db.close()


    @classmethod
    def check_user_exist(cls, username: str):
        url = f"{cls.BASE_URL}api/Admin/GetUsers"
        params = {"username": username}
        try:
            headers = cls._headers()
            resp = requests.get(url, params=params, headers=headers)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"TSD check_user_exist failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def create_user(cls, dto: dict):
        url = f"{cls.BASE_URL}api/Auth/register"
        payload = {
            "username": dto.get("username"),
            "password": dto.get("password"),
            "role": dto.get("role", "User")
        }
        if dto.get("org"):
            payload["org"] = dto.get("org")
        if dto.get("deviceID"):
            payload["deviceID"] = dto.get("deviceID")
        if dto.get("deviceName"):
            payload["deviceName"] = dto.get("deviceName")

        try:
            headers = cls._headers()
            resp = requests.post(url, json=payload, headers=headers)
            resp.raise_for_status()

            log_to_db("INFO", f"TSD created user {dto.get('username')}")
            cls.sync_users()
            return resp.json()
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
            return {"status": "ok", "message": "Active status toggled"}
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
            cls.sync_users()
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
            cls.sync_users()
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
            cls.sync_users()
            return resp.json()
        except Exception as e:
            logger.error(f"TSD set_org failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def set_expire(cls, username: str, expire_date: str):
        url = f"{cls.BASE_URL}api/Admin/SetExpireDate"
        try:
            dt = datetime.fromisoformat(expire_date.replace("Z", "+00:00"))
            formatted_date = dt.strftime("%Y-%m-%dT%H:%M:%S")
        except ValueError:
            formatted_date = expire_date

        params = {"username": username, "expireDate": formatted_date}

        try:
            headers = cls._headers()
            resp = requests.patch(url, params=params, headers=headers)
            resp.raise_for_status()

            log_to_db("INFO", f"TSD set expire {username} -> {formatted_date}")
            cls.sync_users()
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
            log_to_db("INFO", f"TSD deleted user {username}")
            cls.sync_users()
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
            log_to_db("INFO", f"TSD toggled active {username}")
            cls.sync_users()
            return resp.json()
        except Exception as e:
            logger.error(f"TSD active_user failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def update_user(cls, username: str, org: str = None, bin_code: str = None, count: int = None,
                    expire_date: str = None):
        headers = cls._headers()
        try:
            if org is not None:
                requests.patch(f"{cls.BASE_URL}api/Admin/SetOrg",
                               params={"username": username, "org": org},
                               headers=headers).raise_for_status()

            if bin_code:
                requests.patch(f"{cls.BASE_URL}api/Admin/SetBIN",
                               params={"username": username, "bin": bin_code},
                               headers=headers).raise_for_status()

            if count is not None:
                requests.patch(f"{cls.BASE_URL}api/Admin/SetDeviceCount",
                               params={"username": username, "countdevice": count},
                               headers=headers).raise_for_status()

            if expire_date is not None:
                try:
                    dt = datetime.fromisoformat(expire_date.replace("Z", "+00:00"))
                    formatted_date = dt.strftime("%Y-%m-%dT%H:%M:%S")
                except ValueError:
                    formatted_date = expire_date

                requests.patch(f"{cls.BASE_URL}api/Admin/SetExpireDate",
                               params={"username": username, "expireDate": formatted_date},
                               headers=headers).raise_for_status()

            cls.sync_users()
            return {"status": "ok"}

        except Exception as e:
            logger.error(f"Error updating TSD user {username}: {e}")
            raise HTTPException(status_code=500, detail=str(e))