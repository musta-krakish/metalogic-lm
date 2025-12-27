import requests
from datetime import datetime
import io
import pandas as pd

from fastapi import HTTPException
from sqlalchemy import text, func, or_, cast, Boolean
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
        url = f"{cls.BASE_URL}login"
        payload = {
            "username": cls.USERNAME,
            "password": cls.PASSWORD,
        }
        try:
            resp = requests.post(url, json=payload)
            resp.raise_for_status()
            token = resp.text.strip().replace('"', '')
            if not token:
                raise RuntimeError("Пустой токен от Tinda")
            return token
        except Exception as e:
            logger.error(f"Tinda login failed: {e}")
            log_to_db("ERROR", f"Tinda login failed: {e}")
            raise HTTPException(status_code=500, detail="Ошибка авторизации в Tinda")

    @classmethod
    def _get_headers(cls) -> dict:
        token = cls._get_token()
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    @staticmethod
    def _build_filtered_query(db, search: str | None = None,
                              status: str | None = None,
                              org: str | None = None,
                              bin_value: str | None = None):

        query = db.query(TindaUser)

        if search:
            pattern = f"%{search.lower()}%"
            search_condition = or_(
                func.lower(text("data->>'login'")).like(pattern),
                func.lower(text("data->>'org'")).like(pattern),
                func.lower(text("data->>'bin'")).like(pattern),
            )
            query = query.filter(search_condition)

        if status and status != "all":
            is_active_field = TindaUser.data.op('->>')('isActive')

            if status == "active":
                query = query.filter(cast(is_active_field, Boolean).is_(True))
            elif status == "inactive":
                query = query.filter(cast(is_active_field, Boolean).is_(False))

        if org:
            org_pattern = f"%{org.lower()}%"
            org_condition = text("LOWER(data->>'org') LIKE :org_pattern").bindparams(
                org_pattern=org_pattern
            )
            query = query.filter(org_condition)

        if bin_value:
            bin_pattern = f"%{bin_value}%"
            bin_condition = text("data->>'bin' LIKE :bin_pattern").bindparams(
                bin_pattern=bin_pattern
            )
            query = query.filter(bin_condition)

        return query


    @classmethod
    def sync_users(cls):
        db = SessionLocal()
        try:
            headers = cls._get_headers()
            url = f"{cls.BASE_URL}Admin/GetUsers"
            resp = requests.get(url, headers=headers)
            resp.raise_for_status()
            data = resp.json()

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
            query = TindaController._build_filtered_query(
                db, search, status, org, bin_value
            )

            total = query.count()
            query = query.order_by(TindaUser.updated_at.desc())

            users = (
                query.offset((page - 1) * limit)
                .limit(limit)
                .all()
            )

            items = [u.data for u in users]

            return {
                "page": page,
                "limit": limit,
                "total": total,
                "items": items,
            }
        finally:
            db.close()

    @staticmethod
    def export_users_to_excel(
            search: str | None = None,
            status: str | None = None,
            org: str | None = None,
            bin_value: str | None = None,
    ):
        db = SessionLocal()
        try:
            query = TindaController._build_filtered_query(
                db, search, status, org, bin_value
            )
            query = query.order_by(TindaUser.updated_at.desc())
            users = query.all()

            rows = []
            for u in users:
                item = u.data

                expire_raw = item.get("expireDate", "")
                create_raw = item.get("createDate", "")

                expire_formatted = expire_raw
                if expire_raw:
                    try:
                        dt = datetime.fromisoformat(expire_raw.replace("Z", "+00:00"))
                        expire_formatted = dt.strftime("%d.%m.%Y %H:%M")
                    except:
                        pass

                rows.append({
                    "Id": item.get("_Id"),
                    "Login": item.get("login", ""),
                    "Organization": item.get("org", ""),
                    "BIN": item.get("bin", ""),
                    "Status": "Active" if item.get("isActive") else "Inactive",
                    "Role": item.get("role", ""),
                    "Create Date": create_raw,
                    "Expire Date": expire_formatted
                })

            if rows:
                df = pd.DataFrame(rows)
            else:
                df = pd.DataFrame(
                    columns=["Login", "Organization", "BIN", "Status", "Role", "Create Date", "Expire Date"])

            output = io.BytesIO()
            with pd.ExcelWriter(output, engine="openpyxl") as writer:
                df.to_excel(writer, sheet_name="TindaUsers", index=False)

                worksheet = writer.sheets['TindaUsers']
                for column in worksheet.columns:
                    max_length = 0
                    column = [cell for cell in column]
                    for cell in column:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(str(cell.value))
                        except:
                            pass
                    adjusted_width = (max_length + 2)
                    worksheet.column_dimensions[column[0].column_letter].width = adjusted_width

            output.seek(0)
            filename = f"tinda_users_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            return output, filename
        finally:
            db.close()

    # при выдаче любой даты отдает одну и тоже и на bin ему тоже похуй
    @classmethod
    def create_user(cls, username: str, password: str, org: str, bin_val: str, expire_date: str, role: int):
        try:
            headers = cls._get_headers()
            url = f"{cls.BASE_URL}Register"

            payload = {
                "username": username,
                "password": password,
                "org": org,
                "bin": bin_val,
                "expireDate": expire_date,
                "role": role
            }

            resp = requests.post(url, json=payload, headers=headers)
            resp.raise_for_status()

            try:
                data = resp.json()
            except:
                data = {"message": resp.text}

            log_to_db("INFO", f"Created Tinda user: {username}")

            cls.sync_users()

            return data
        except Exception as e:
            logger.error(f"Tinda create_user failed: {e}")
            log_to_db("ERROR", f"Tinda create_user failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def set_org(cls, user_id: str, org: str):
        try:
            headers = cls._get_headers()
            url = f"{cls.BASE_URL}Admin/SetOrg/{user_id}"
            params = {"Org": org}

            resp = requests.patch(url, params=params, headers=headers)
            resp.raise_for_status()

            log_to_db("INFO", f"Tinda set_org for user {user_id} -> {org}")
            cls.sync_users()
            return {"status": "ok", "message": "Organization updated"}
        except Exception as e:
            logger.error(f"Tinda set_org failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def set_active(cls, user_id: str):
        try:
            headers = cls._get_headers()
            url = f"{cls.BASE_URL}Admin/SetActive/{user_id}"
            resp = requests.patch(url, headers=headers)
            resp.raise_for_status()

            log_to_db("INFO", f"Tinda set_active for user {user_id}")
            cls.sync_users()
            return {"status": "ok", "message": "Active status toggled"}
        except Exception as e:
            logger.error(f"Tinda set_active failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def set_bin(cls, user_id: str, bin_value: str):
        try:
            headers = cls._get_headers()
            url = f"{cls.BASE_URL}Admin/SetBIN/{user_id}"
            params = {"bin": bin_value}

            resp = requests.patch(url, params=params, headers=headers)
            resp.raise_for_status()

            log_to_db("INFO", f"Tinda set_bin for user {user_id} -> {bin_value}")
            cls.sync_users()
            return {"status": "ok", "message": "BIN updated"}
        except Exception as e:
            logger.error(f"Tinda set_bin failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def set_expire_date(cls, user_id: str, expire_date: str):
        try:
            headers = cls._get_headers()
            url = f"{cls.BASE_URL}Admin/SetExpireDate/{user_id}"
            params = {"date": expire_date}

            resp = requests.patch(url, params=params, headers=headers)
            resp.raise_for_status()

            log_to_db("INFO", f"Tinda set_expire_date for user {user_id} -> {expire_date}")
            cls.sync_users()
            return {"status": "ok", "message": "Expire date updated"}
        except Exception as e:
            logger.error(f"Tinda set_expire_date failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def update_user(cls, user_id: str, org: str = None, bin_code: str = None, expire_date: str = None):
        try:

            if org is not None:
                url = f"{cls.BASE_URL}Users/SetOrg"
                resp = requests.patch(url, params={"id": user_id, "text": org}, auth=cls._auth())
                resp.raise_for_status()


            if bin_code is not None:
                url = f"{cls.BASE_URL}Users/SetBin"
                resp = requests.patch(url, params={"id": user_id, "text": bin_code}, auth=cls._auth())
                resp.raise_for_status()

            if expire_date is not None:
                url = f"{cls.BASE_URL}Users/SetExpireDate"
                resp = requests.patch(url, params={"id": user_id, "date": expire_date}, auth=cls._auth())
                resp.raise_for_status()

            cls.sync_users()
            return {"status": "ok", "message": "User updated"}

        except Exception as e:
            logger.error(f"Error updating Tinda user {user_id}: {e}")
            raise HTTPException(status_code=500, detail=str(e))