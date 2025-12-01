import requests
from fastapi import HTTPException
from sqlalchemy import text, func, or_
from typing import Optional
from app.database.database import SessionLocal
from app.database.schemas import LicenseArca
from app.core.logger import logger, log_to_db
from datetime import datetime
import pandas as pd
import io
from app.core.config import settings

class ArcaController:
    BASE_URL = settings.ARCA_BASE_URL
    BASIC_USERNAME = settings.ARCA_BASIC_USERNAME
    BASIC_PASSWORD = settings.ARCA_BASIC_PASSWORD

    @classmethod
    def _auth(cls):
        return (cls.BASIC_USERNAME, cls.BASIC_PASSWORD)

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
    def _build_filtered_query(db, search: str | None = None,
                              status: str | None = None,
                              org: str | None = None,
                              bin_value: str | None = None):

        query = db.query(LicenseArca)


        if search:
            pattern = f"%{search.lower()}%"
            search_condition = or_(
                func.lower(text("data->>'mac_address'")).like(pattern),
                func.lower(text("data->>'licences_key'")).like(pattern),
                func.lower(text("data->>'bin'")).like(pattern),
                func.lower(text("data->>'org'")).like(pattern),
            )
            query = query.filter(search_condition)

        # Статус: "active"/"inactive"/"True"/"False"
        if status and status != "all":
            if status.lower() in ("active", "inactive"):
                status_val = "True" if status.lower() == "active" else "False"
            else:
                status_val = status
            status_condition = text("data->>'status' = :status_val").bindparams(
                status_val=status_val
            )
            query = query.filter(status_condition)

        # Фильтр по org (LIKE)
        if org:
            org_pattern = f"%{org.lower()}%"
            org_condition = text("LOWER(data->>'org') LIKE :org_pattern").bindparams(
                org_pattern=org_pattern
            )
            query = query.filter(org_condition)

        # Фильтр по bin
        if bin_value:
            bin_pattern = f"%{bin_value}%"
            bin_condition = text("data->>'bin' LIKE :bin_pattern").bindparams(
                bin_pattern=bin_pattern
            )
            query = query.filter(bin_condition)

        return query

    @staticmethod
    def get_licenses(
            page: int = 1,
            limit: int = 50,
            search: str | None = None,
            status: str | None = None,
            org: str | None = None,
            bin_value: str | None = None,
    ):
        """
        Возвращает лицензии ARCA с пагинацией и фильтрами.
        """
        db = SessionLocal()
        try:
            query = ArcaController._build_filtered_query(
                db,
                search=search,
                status=status,
                org=org,
                bin_value=bin_value,
            )

            total = query.count()
            query = query.order_by(LicenseArca.updated_at.desc())
            licenses = (
                query.offset((page - 1) * limit)
                .limit(limit)
                .all()
            )

            items = [l.data for l in licenses]

            return {
                "page": page,
                "limit": limit,
                "total": total,
                "items": items,
            }
        except Exception as e:
            logger.error(f"Ошибка при получении лицензий ARCA: {e}")
            raise HTTPException(status_code=500, detail="Failed to get ARCA licenses")
        finally:
            db.close()

    @staticmethod
    def export_licenses_to_excel(
            search: str | None = None,
            status: str | None = None,
            org: str | None = None,
            bin_value: str | None = None,
    ):

        db = SessionLocal()
        try:
            query = ArcaController._build_filtered_query(
                db,
                search=search,
                status=status,
                org=org,
                bin_value=bin_value,
            )
            query = query.order_by(LicenseArca.updated_at.desc())
            licenses = query.all()
            licenses_data = [l.data for l in licenses]

            rows = []
            for item in licenses_data:
                mac = item.get("mac_address", "")
                key = item.get("licences_key", "")
                lic_date = item.get("licences_date", "")
                bin_code = item.get("bin", "")
                org_name = item.get("org", "")
                status_val = item.get("status", "")
                expire_raw = item.get("expire_date", "")

                if expire_raw:
                    try:
                        dt = datetime.fromisoformat(expire_raw.replace("Z", "+00:00"))
                        expire_date = dt.strftime("%d.%m.%Y %H:%M")
                    except Exception:
                        expire_date = expire_raw
                else:
                    expire_date = ""

                rows.append(
                    {
                        "MAC": mac,
                        "License key": key,
                        "License date": lic_date,
                        "BIN": bin_code,
                        "Org": org_name,
                        "Status": status_val,
                        "Expire date": expire_date,
                    }
                )

            if not rows:
                df = pd.DataFrame(
                    columns=[
                        "MAC",
                        "License key",
                        "License date",
                        "BIN",
                        "Org",
                        "Status",
                        "Expire date",
                    ]
                )
            else:
                df = pd.DataFrame(rows)

            output = io.BytesIO()
            with pd.ExcelWriter(output, engine="openpyxl") as writer:
                df.to_excel(writer, index=False, sheet_name="ARCA Licenses")
            output.seek(0)

            filename = f"arca_licenses_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
            return output, filename
        except Exception as e:
            logger.error(f"Ошибка при экспорте лицензий ARCA: {e}")
            raise HTTPException(status_code=500, detail="Failed to export ARCA licenses")
        finally:
            db.close()

    @classmethod
    def create_license(
            cls,
            mac: str,
            key: str,
            date: str,
            org: Optional[str] = None,
            bin_code: Optional[str] = None,
    ):
        url = f"{cls.BASE_URL}createLicences"

        params: dict[str, str] = {
            "mac_address": mac,
            "license_key": key,
            "license_date": date,
        }

        if org is not None:
            params["org"] = org
        if bin_code is not None:
            params["bin"] = bin_code

        try:
            resp = requests.post(url, params=params, auth=cls._auth())
            resp.raise_for_status()
            data = resp.json()

            log_to_db("INFO", f"Created ARCA license {mac}")

            cls.sync_licenses()

            return data
        except Exception as e:
            logger.error(f"Ошибка создания лицензии ARCA: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def delete_license(cls, mac: str):
        url = f"{cls.BASE_URL}unreqisterLicense"
        try:
            # БЛЯТЬ ТУТ вторая c в maccadress должна быть на кириллице
            resp = requests.get(url, params={"macсadress": mac}, auth=cls._auth())
            resp.raise_for_status()
            try:
                data = resp.json()
            except ValueError:
                data = {"raw_response": resp.text or None}
            log_to_db("INFO", f"Deleted ARCA license {mac}")

            cls.sync_licenses()

            return data
        except Exception as e:
            logger.error(f"Ошибка удаления лицензии ARCA: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def set_bin(cls, mac: str, bin_code: str):
        url = f"{cls.BASE_URL}setBIN"
        params = {"mac_address": mac, "bin": bin_code}
        try:
            resp = requests.patch(url, params=params, auth=cls._auth())
            resp.raise_for_status()
            try:
                data = resp.json()
            except ValueError:
                data = {"raw_response": resp.text or None}
            log_to_db("INFO", f"Set BIN for ARCA license {mac} -> {bin_code}")
            cls.sync_licenses()
            return data
        except Exception as e:
            logger.error(f"Ошибка установки BIN для ARCA лицензии {mac}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def set_org(cls, mac: str, org: str):
        url = f"{cls.BASE_URL}setOrg"
        params = {"mac_address": mac, "org": org}
        try:
            resp = requests.patch(url, params=params, auth=cls._auth())
            resp.raise_for_status()
            try:
                data = resp.json()
            except ValueError:
                data = {"raw_response": resp.text or None}
            log_to_db("INFO", f"Set ORG for ARCA license {mac} -> {org}")
            cls.sync_licenses()
            return data
        except Exception as e:
            logger.error(f"Ошибка установки ORG для ARCA лицензии {mac}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def set_expire_date(cls, mac: str, expire_date: str):
        url = f"{cls.BASE_URL}setExDate"
        params = {"mac_address": mac, "ExpireDate": expire_date}
        try:
            resp = requests.patch(url, params=params, auth=cls._auth())
            resp.raise_for_status()
            try:
                data = resp.json()
            except ValueError:
                data = {"raw_response": resp.text or None}
            log_to_db("INFO", f"Set expire date for ARCA license {mac} -> {expire_date}")
            cls.sync_licenses()
            return data
        except Exception as e:
            logger.error(f"Ошибка установки expire date для ARCA лицензии {mac}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def set_active(cls, mac: str):
        url = f"{cls.BASE_URL}setActive"
        params = {"mac_address": mac}
        try:
            resp = requests.patch(url, params=params, auth=cls._auth())
            resp.raise_for_status()
            try:
                data = resp.json()
            except ValueError:
                data = {"raw_response": resp.text or None}
            log_to_db("INFO", f"Activated ARCA license {mac}")
            cls.sync_licenses()
            return data
        except Exception as e:
            logger.error(f"Ошибка активации ARCA лицензии {mac}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def change_license(
            cls,
            mac_address: str,
            license_key: Optional[str] = None,
            license_date: Optional[str] = None,
            status: Optional[str] = None,
            org: Optional[str] = None,
            bin_code: Optional[str] = None,
    ):
        url = f"{cls.BASE_URL}changeLineces"

        params = {
            "mac_address": mac_address,
            "license_key": license_key,
            "license_date": license_date,
            "status": status,
            "org": org,
            "bin": bin_code,
        }
        params = {k: v for k, v in params.items() if v is not None}

        try:
            resp = requests.post(url, params=params, auth=cls._auth())
            resp.raise_for_status()
            try:
                data = resp.json()
            except ValueError:
                data = {"raw_response": resp.text or None}

            log_to_db("INFO", f"Changed ARCA license {mac_address}")

            cls.sync_licenses()

            return data
        except Exception as e:
            logger.error(f"Ошибка изменения ARCA лицензии {mac_address}: {e}")
            raise HTTPException(status_code=500, detail=str(e))