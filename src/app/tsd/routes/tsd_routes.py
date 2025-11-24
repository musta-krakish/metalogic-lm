from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from app.tsd.controllers.tsd_controller import TsdController
from app.tsd.controllers.tsd_scheduler import TsdScheduler
from app.auth.auth import require_role
from app.auth.models.auth_models import UserRole

router = APIRouter(
    prefix="/tsd",
    tags=["tsd"],
    dependencies=[require_role(UserRole.admin)]
)

@router.get("/users")
def get_users():
    return TsdController.get_users()

@router.post("/update")
def update_users():
    TsdScheduler.update_users()
    return {"status": "ok", "message": "TSD users synced"}

@router.get("/users/export")
def export_users():
    try:
        excel, filename = TsdController.export_users_to_excel()
        return StreamingResponse(
            excel,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/create")
def create_user(payload: dict):
    return TsdController.create_user(payload)

@router.post("/users/{username}/set-pass")
def set_pass(username: str, password: str = Query(...)):
    return TsdController.set_pass(username, password)

@router.post("/users/{username}/set-device-count")
def set_device_count(username: str, count: int = Query(...)):
    return TsdController.set_device_count(username, count)

@router.post("/users/{username}/set-bin")
def set_bin(username: str, bin: str = Query(...)):
    return TsdController.set_bin(username, bin)

@router.post("/users/{username}/set-org")
def set_org(username: str, org: str = Query(...)):
    return TsdController.set_org(username, org)

@router.post("/users/{username}/set-expire")
def set_expire(username: str, expire_date: str = Query(...)):
    return TsdController.set_expire(username, expire_date)

@router.get("/users/{username}")
def get_user_detail(username: str):
    return TsdController.get_user_detail(username)

@router.delete("/users/{username}")
def delete_user(username: str):
    return TsdController.delete_user(username)

@router.post("/users/{username}/active")
def active_user(username: str):
    return TsdController.active_user(username)
