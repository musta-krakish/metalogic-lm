import requests
import pymongo
from fastapi import HTTPException
from sqlalchemy import text, or_, func, cast, Boolean
from datetime import datetime
import pandas as pd
import io

from app.database.database import SessionLocal
from app.database.schemas import KaspiUser
from app.core.logger import logger, log_to_db
from app.core.config import settings


class KaspiController:
    API_URL = settings.KASPI_API_URL

    MONGO_URI = f"mongodb://{settings.KASPI_MONGO_USER}:{settings.KASPI_MONGO_PASSWORD}@{settings.KASPI_MONGO_HOST}:{settings.KASPI_MONGO_PORT}/"
    DB_NAME = settings.KASPI_MONGO_DB

    @classmethod
    def sync_users(cls):
        pg_db = SessionLocal()
        mongo_client = None
        try:
            mongo_client = pymongo.MongoClient(cls.MONGO_URI, serverSelectionTimeoutMS=5000)
            mongo_db = mongo_client[cls.DB_NAME]
            collection = mongo_db["User"]

            mongo_users = list(collection.find({}))

            synced_count = 0

            for doc in mongo_users:
                m_id = str(doc.get("_id", ""))

                user_logins = doc.get("UserLogins", [])
                login = "Unknown"
                if user_logins and isinstance(user_logins, list):
                    login = user_logins[0].get("Login", "Unknown")

                is_verified = doc.get("IsVerified", False)
                role = doc.get("UserRole", 0)
                password = doc.get("Password", "")

                created_date = doc.get("CreatedDate")
                if isinstance(created_date, dict) and "$date" in created_date:
                    try:
                        created_date = datetime.fromisoformat(created_date["$date"].replace("Z", "+00:00"))
                    except:
                        created_date = None

                local_user = pg_db.query(KaspiUser).filter(KaspiUser.mongo_id == m_id).first()

                if not local_user:
                    local_user = KaspiUser(mongo_id=m_id)
                    pg_db.add(local_user)

                local_user.login = login
                local_user.is_verified = is_verified
                local_user.role = role
                local_user.password_hash = password
                local_user.created_at = created_date
                local_user.data = str(doc)

                synced_count += 1

            pg_db.commit()

            logger.info(f"Kaspi users synced: {synced_count}")
            log_to_db("INFO", f"Kaspi users synced: {synced_count}")

        except Exception as e:
            pg_db.rollback()
            logger.error(f"Kaspi sync failed: {e}")
            log_to_db("ERROR", f"Kaspi sync failed: {e}")
            raise HTTPException(status_code=500, detail=f"Mongo Sync Error: {str(e)}")
        finally:
            pg_db.close()
            if mongo_client:
                mongo_client.close()

    @classmethod
    def create_user(cls, login: str, password: str):
        url = f"{cls.API_URL.rstrip('/')}/Auth/register"

        payload = {
            "userLogin": {
                "login": login,
                "authType": 0
            },
            "password": password
        }

        headers = {
            'accept': '*/*',
            'Content-Type': 'application/json'
        }

        try:
            resp = requests.post(url, json=payload, headers=headers)

            if resp.status_code not in [200, 201]:
                raise Exception(f"API Error {resp.status_code}: {resp.text}")

            log_to_db("INFO", f"Created Kaspi user: {login}")

            cls.sync_users()

            try:
                return resp.json()
            except:
                return {"status": "ok", "message": "User created (no json response)"}

        except Exception as e:
            logger.error(f"Kaspi create_user failed: {e}")
            log_to_db("ERROR", f"Kaspi create_user failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @staticmethod
    def get_users(page: int = 1, limit: int = 50, search: str = None, status: str = None):
        db = SessionLocal()
        try:
            query = db.query(KaspiUser)

            if search:
                pattern = f"%{search.lower()}%"
                query = query.filter(func.lower(KaspiUser.login).like(pattern))

            if status and status != "all":
                if status == "verified":
                    query = query.filter(KaspiUser.is_verified == True)
                elif status == "unverified":
                    query = query.filter(KaspiUser.is_verified == False)

            total = query.count()
            query = query.order_by(KaspiUser.created_at.desc())

            users = query.offset((page - 1) * limit).limit(limit).all()

            items = []
            for u in users:
                items.append({
                    "mongo_id": u.mongo_id,
                    "login": u.login,
                    "role": u.role,
                    "is_verified": u.is_verified,
                    "created_at": u.created_at.isoformat() if u.created_at else None
                })

            return {"page": page, "limit": limit, "total": total, "items": items}
        finally:
            db.close()

    @staticmethod
    def export_users_to_excel(search: str = None, status: str = None):
        db = SessionLocal()
        try:
            query = db.query(KaspiUser)
            if search:
                query = query.filter(func.lower(KaspiUser.login).like(f"%{search.lower()}%"))
            if status == "verified":
                query = query.filter(KaspiUser.is_verified == True)
            elif status == "unverified":
                query = query.filter(KaspiUser.is_verified == False)

            query = query.order_by(KaspiUser.created_at.desc())
            users = query.all()

            rows = []
            for u in users:
                rows.append({
                    "Login": u.login,
                    "Is Verified": "Yes" if u.is_verified else "No",
                    "Role": u.role,
                    "Created At": u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else "",
                    "Mongo ID": u.mongo_id
                })

            df = pd.DataFrame(rows) if rows else pd.DataFrame(
                columns=["Login", "Is Verified", "Role", "Created At", "Mongo ID"])

            output = io.BytesIO()
            with pd.ExcelWriter(output, engine="openpyxl") as writer:
                df.to_excel(writer, sheet_name="KaspiUsers", index=False)
            output.seek(0)

            filename = f"kaspi_users_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            return output, filename
        finally:
            db.close()