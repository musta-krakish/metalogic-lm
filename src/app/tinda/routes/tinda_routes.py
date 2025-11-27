
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import StreamingResponse

from app.tinda.controllers.tinda_controller import TindaController
from app.tinda.controllers.tinda_scheduler import TindaScheduler
from app.auth.auth import require_role
from app.auth.models.auth_models import UserRole

router = APIRouter(
    prefix="/tinda",
    tags=["tinda"],
    dependencies=[Depends(require_role(UserRole.admin))]
)

@router.get("/users")
def get_users():
    """Список пользователей Tinda из БД."""
    return TindaController.get_users()

@router.post("/update")
def update_users():
    """Форс-синхронизация пользователей Tinda с внешним API."""
    TindaScheduler.update_users()
    return {"status": "ok", "message": "Tinda users updated"}

@router.get("/users/export")
def export_users():
    """Выгрузка пользователей Tinda в Excel."""
    try:
        excel_file, filename = TindaController.export_users_to_excel()
        return StreamingResponse(
            excel_file,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/create")
def create_user(payload: dict):
    """Создание пользователя Tinda (обёртка над Register)."""
    return TindaController.create_user(payload)

@router.post("/users/{user_id}/set-org")
def set_org(user_id: int, org: str = Query(...)):
    return TindaController.set_org(user_id, org)

@router.post("/users/{user_id}/set-active")
def set_active(user_id: int):
    return TindaController.set_active(user_id)

@router.post("/users/{user_id}/set-bin")
def set_bin(user_id: int, bin: str = Query(...)):
    return TindaController.set_bin(user_id, bin)

@router.post("/users/{user_id}/set-expire-date")
def set_expire_date(user_id: int, expire_date: str = Query(..., description="Формат YYYY-MM-DDTHH:MM:SS")):
    return TindaController.set_expire_date(user_id, expire_date)
