import requests
from fastapi import HTTPException
from sqlalchemy import and_, or_, func, text
from app.database.database import SessionLocal
import io
import pandas as pd
from datetime import datetime
from app.database.schemas import LicenseIiko
from app.core.logger import logger, log_to_db
from app.iiko.controllers.iiko_scheduler import IikoScheduler

class IikoController:
    API_URL = "https://api.lm.gosu.kz/license"
    API_KEY = "liErLyguNEOLOwPOLINIteRFloGAgEackWaRSONiaHLocrECTa"

    @staticmethod
    def get_licenses(
        page: int = 1,
        limit: int = 10,
        search: str = None,
        status: str = None,
        organization_id: str = None,
        is_online: bool = None,
        sort_by: str = "updated_at",
        sort_order: str = "desc"
    ):
        db = SessionLocal()
        try:
            # Базовый запрос
            query = db.query(LicenseIiko)
            
            # Поиск по организации или коду лицензии
            if search:
                # Используем text() для JSON поиска
                search_condition = text(
                    "data->'license'->'organization'->>'name' ILIKE :search OR "
                    "data->'license'->>'licenseCode' ILIKE :search OR "
                    "data->'license'->>'organizationId' ILIKE :search"
                )
                query = query.filter(search_condition.bindparams(search=f"%{search}%"))
            
            # Фильтр по статусу
            if status and status != 'all':
                if status == 'active':
                    status_condition = text("data->'license'->>'isActive' = 'true'")
                    query = query.filter(status_condition)
                elif status == 'expired':
                    status_condition = text(
                        "data->'license'->>'isActive' = 'false' OR "
                        "data->'license'->>'isActive' IS NULL"
                    )
                    query = query.filter(status_condition)
            
            # Фильтр по организации
            if organization_id:
                org_condition = text("data->'license'->>'organizationId' = :org_id")
                query = query.filter(org_condition.bindparams(org_id=organization_id))
            
            # Фильтр по онлайн статусу
            if is_online is not None:
                online_value = 'true' if is_online else 'false'
                online_condition = text("data->'license'->>'isOnline' = :online_val")
                query = query.filter(online_condition.bindparams(online_val=online_value))
            
            # Получаем общее количество
            total = query.count()
            
            # Сортировка
            if sort_by and sort_order:
                if sort_by == "organization":
                    order_clause = text("data->'license'->'organization'->>'name'")
                elif sort_by == "status":
                    order_clause = text("data->'license'->>'isActive'")
                elif sort_by == "lastRequestDate":
                    order_clause = text("data->'license'->>'lastRequestDate'")
                elif sort_by == "expirationDate":
                    order_clause = text("data->'license'->>'licenseExpirationDate'")
                else:
                    order_clause = LicenseIiko.updated_at
                
                if sort_order == "desc":
                    query = query.order_by(order_clause.desc())
                else:
                    query = query.order_by(order_clause.asc())
            else:
                query = query.order_by(LicenseIiko.updated_at.desc())
            
            # Пагинация
            licenses = query.offset((page - 1) * limit).limit(limit).all()
            
            result = [l.data for l in licenses]
            return {
                "page": page,
                "limit": limit,
                "total": total,
                "items": result,
            }
        except Exception as e:
            print(f"Error in get_licenses: {str(e)}")
            raise
        finally:
            db.close()

    @staticmethod
    def export_licenses_to_excel(
        search: str = None,
        status: str = None,
        organization_id: str = None,
        is_online: bool = None
    ):
        db = SessionLocal()
        try:
            # Базовый запрос (аналогично get_licenses но без пагинации)
            query = db.query(LicenseIiko)
            
            if search:
                search_condition = text(
                    "data->'license'->'organization'->>'name' ILIKE :search OR "
                    "data->'license'->>'licenseCode' ILIKE :search OR "
                    "data->'license'->>'organizationId' ILIKE :search"
                )
                query = query.filter(search_condition.bindparams(search=f"%{search}%"))
            
            if status and status != 'all':
                if status == 'active':
                    status_condition = text("data->'license'->>'isActive' = 'true'")
                    query = query.filter(status_condition)
                elif status == 'expired':
                    status_condition = text(
                        "data->'license'->>'isActive' = 'false' OR "
                        "data->'license'->>'isActive' IS NULL"
                    )
                    query = query.filter(status_condition)
            
            if organization_id:
                org_condition = text("data->'license'->>'organizationId' = :org_id")
                query = query.filter(org_condition.bindparams(org_id=organization_id))
            
            if is_online is not None:
                online_value = 'true' if is_online else 'false'
                online_condition = text("data->'license'->>'isOnline' = :online_val")
                query = query.filter(online_condition.bindparams(online_val=online_value))
            
            licenses = query.order_by(LicenseIiko.updated_at.desc()).all()
            licenses_data = [l.data for l in licenses]
            
            # Преобразуем данные для Excel
            excel_data = []
            for license_item in licenses_data:
                license = license_item.get('license', {})
                org = license.get('organization', {})
                
                # Форматируем даты
                generate_date = license.get('generateDate', '')
                last_request_date = license.get('lastRequestDate', '')
                expiration_date = license.get('licenseExpirationDate', '')
                
                if generate_date:
                    try:
                        generate_date = datetime.fromisoformat(generate_date.replace('Z', '+00:00')).strftime('%d.%m.%Y %H:%M')
                    except:
                        pass
                
                if last_request_date:
                    try:
                        last_request_date = datetime.fromisoformat(last_request_date.replace('Z', '+00:00')).strftime('%d.%m.%Y %H:%M')
                    except:
                        pass
                
                if expiration_date:
                    try:
                        expiration_date = datetime.fromisoformat(expiration_date.replace('Z', '+00:00')).strftime('%d.%m.%Y %H:%M')
                    except:
                        pass
                
                excel_data.append({
                    'ID организации': license.get('organizationId', ''),
                    'Название организации': org.get('name', ''),
                    'Код лицензии': license.get('licenseCode', ''),
                    'Продукт': license.get('productName', ''),
                    'Подписка': license.get('productSubName', ''),
                    'AP ID': license.get('apUId', ''),
                    'Статус': 'Активна' if license.get('isActive') else 'Истекла',
                    'Онлайн': 'Да' if license.get('isOnline') else 'Нет',
                    'Включена': 'Да' if license.get('isEnabled') else 'Нет',
                    'Дата генерации': generate_date,
                    'Последний запрос': last_request_date,
                    'Истекает': expiration_date,
                    'ID лицензии': license.get('id', '')
                })
            
            # Создаем DataFrame
            if excel_data:
                df = pd.DataFrame(excel_data)
            else:
                # Создаем пустой DataFrame с правильными колонками
                df = pd.DataFrame(columns=[
                    'ID организации', 'Название организации', 'Код лицензии', 
                    'Продукт', 'Подписка', 'AP ID', 'Статус', 'Онлайн', 
                    'Включена', 'Дата генерации', 'Последний запрос', 
                    'Истекает', 'ID лицензии'
                ])
            
            # Создаем Excel файл в памяти
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, sheet_name='Лицензии iiko', index=False)
                
                # Форматируем колонки
                worksheet = writer.sheets['Лицензии iiko']
                for column in worksheet.columns:
                    max_length = 0
                    column_letter = column[0].column_letter
                    for cell in column:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(str(cell.value))
                        except:
                            pass
                    adjusted_width = min(max_length + 2, 50)
                    worksheet.column_dimensions[column_letter].width = adjusted_width
            
            output.seek(0)
            
            # Генерируем имя файла
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"iiko_licenses_{timestamp}.xlsx"
            
            return output, filename
            
        except Exception as e:
            print(f"Error in export_licenses_to_excel: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Ошибка при экспорте: {str(e)}")
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
                       deviceid=None, device_name=None, datetime=None, request=None, response=None, error=None):
        try:
            payload = {
                "license": license_code,
                "ap_uid": ap_uid,
                "ap_online": ap_online,
                "deviceid": deviceid,
                "device_name": device_name,
                "datetime": datetime,
                "request": request,
                "response": response,
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

            IikoScheduler.update_licenses()

            log_to_db("INFO", f"Verified iiko license {license_code[:12]}...")
            return data
        except Exception as e:
            logger.error(f"Ошибка проверки лицензии: {e}")
            log_to_db("ERROR", f"Failed to verify license: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def set_license_active(cls, license_id: str, is_active: bool):
        try:
            url = f"{cls.API_URL}/edit/{license_id}"
            payload = {"isActive": is_active}
            headers = {
                "Accept": "*/*",
                "Content-Type": "application/json",
                "ApiKey": cls.API_KEY,
            }

            resp = requests.patch(url, json=payload, headers=headers)
            resp.raise_for_status()
            try:
                data = resp.json()
            except ValueError:
                data = {"raw_response": resp.text or None}

            state = "activated" if is_active else "deactivated"
            logger.info(f"iiko license {license_id} {state}")
            log_to_db(
                "INFO",
                f"iiko license {license_id} {state} via API",
            )

            IikoScheduler.update_licenses()

            return {
                "status": "ok",
                "upstream_status": resp.status_code,
                "data": data,
            }
        except Exception as e:
            state = "activate" if is_active else "deactivate"
            logger.error(f"Failed to {state} iiko license {license_id}: {e}")
            log_to_db("ERROR", f"Failed to {state} iiko license {license_id}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

    @classmethod
    def activate_license(cls, license_id: str):
        return cls.set_license_active(license_id, True)

    @classmethod
    def deactivate_license(cls, license_id: str):
        return cls.set_license_active(license_id, False)