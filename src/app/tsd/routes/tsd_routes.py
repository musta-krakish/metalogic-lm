from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import StreamingResponse
from app.tsd.controllers.tsd_controller import TsdController
from app.tsd.controllers.tsd_scheduler import TsdScheduler
from app.auth.auth import require_role
from app.auth.models.auth_models import UserRole
from app.tsd.models.tsd_models import (
    TsdCreateUserDto,
    TsdSetPasswordDto,
    TsdSetDeviceCountDto,
    TsdSetBinDto,
    TsdSetOrgDto,
    TsdSetExpireDateDto,
    TsdActiveDto,
    TsdBaseUserDto,
    TsdUpdateUserDto
)

router = APIRouter(
    prefix="/tsd",
    tags=["tsd"],
    dependencies=[Depends(require_role(UserRole.admin))]
)

@router.get("/users")
def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(50, le=500),
    search: str | None = None,
    status: str | None = None,
    org: str | None = None,
    bin: str | None = None,
):
    return TsdController.get_users(
        page=page,
        limit=limit,
        search=search,
        status=status,
        org=org,
        bin_value=bin
    )

@router.post("/update")
def update_users():
    TsdScheduler.update_users()
    return {"status": "ok", "message": "TSD users synced"}

@router.get("/users/export")
def export_users(
    search: str | None = None,
    status: str | None = None,
    org: str | None = None,
    bin: str | None = None,
):
    try:
        excel, filename = TsdController.export_users_to_excel(
            search=search,
            status=status,
            org=org,
            bin_value=bin
        )
        return StreamingResponse(
            excel,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/create")
def create_user(payload: TsdCreateUserDto):
    return TsdController.create_user(payload.dict(exclude_none=True))

@router.get("/users/exist/{username}")
def check_user_exist(username: str):
    return TsdController.check_user_exist(username)

@router.patch("/users/password")
def set_pass(payload: TsdSetPasswordDto):
    return TsdController.set_pass(payload.username, payload.password)

@router.patch("/users/device-count")
def set_device_count(payload: TsdSetDeviceCountDto):
    return TsdController.set_device_count(payload.username, payload.count)

@router.patch("/users/bin")
def set_bin(payload: TsdSetBinDto):
    return TsdController.set_bin(payload.username, payload.bin)

@router.patch("/users/org")
def set_org(payload: TsdSetOrgDto):
    return TsdController.set_org(payload.username, payload.org)

@router.patch("/users/expire-date")
def set_expire(payload: TsdSetExpireDateDto):
    return TsdController.set_expire(payload.username, payload.expire_date)

@router.patch("/users/active")
def active_user(payload: TsdActiveDto):
    return TsdController.active_user(payload.username)

@router.get("/users/{username}")
def get_user_detail(username: str):
    return TsdController.get_user_detail(username)

@router.post("/users/delete")
def delete_user(payload: TsdBaseUserDto):
    return TsdController.delete_user(payload.username)

@router.patch("/users/update")
def update_user(payload: TsdUpdateUserDto):
    return TsdController.update_user(
        username=payload.username,
        org=payload.org,
        bin_code=payload.bin,
        count=payload.count,
        expire_date=payload.expire_date
    )