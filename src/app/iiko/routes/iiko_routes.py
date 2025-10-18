from fastapi import APIRouter, Depends, Query
from app.iiko.controllers.iiko_controller import IikoController
from app.iiko.controllers.iiko_scheduler import IikoScheduler
from app.auth.auth import require_role, get_current_user
from app.auth.models.auth_models import UserRole

router = APIRouter(
    prefix="/iiko",
    tags=["iiko"],
    dependencies=[Depends(require_role(UserRole.admin))]
)

@router.get("/licenses")
def get_licenses(page: int = Query(1, ge=1), limit: int = Query(10, le=100)):
    return IikoController.get_licenses(page, limit)

@router.post("/update")
def update_iiko():
    IikoScheduler.update_licenses()
    return {"status": "ok", "message": "iiko licenses updated"}

@router.post("/license/create")
def create_license(uid: str, title: str):
    return IikoController.create_license(uid, title)

@router.post("/license/verify")
def verify_license(license_code: str):
    return IikoController.verify_license(license_code)
