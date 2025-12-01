from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import StreamingResponse

from app.tinda.controllers.tinda_controller import TindaController
from app.tinda.controllers.tinda_scheduler import TindaScheduler
from app.auth.auth import require_role
from app.auth.models.auth_models import UserRole
from app.tinda.models.tinda_models import (
    TindaCreateUserDto,
    TindaSetOrgDto,
    TindaSetBinDto,
    TindaSetExpireDateDto,
    TindaSetActiveDto
)

router = APIRouter(
    prefix="/tinda",
    tags=["tinda"],
    dependencies=[Depends(require_role(UserRole.admin))]
)

@router.get("/users")
def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    search: str | None = None,
    status: str | None = None,
    org: str | None = None,
    bin: str | None = None,
):
    return TindaController.get_users(
        page=page,
        limit=limit,
        search=search,
        status=status,
        org=org,
        bin_value=bin
    )

@router.post("/update")
def update_users():
    TindaScheduler.update_users()
    return {"status": "ok", "message": "Tinda users updated"}

@router.get("/users/export")
def export_users(
    search: str | None = None,
    status: str | None = None,
    org: str | None = None,
    bin: str | None = None,
):
    try:
        excel_file, filename = TindaController.export_users_to_excel(
            search=search,
            status=status,
            org=org,
            bin_value=bin
        )
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
def create_user(payload: TindaCreateUserDto):
    return TindaController.create_user(
        username=payload.username,
        password=payload.password,
        org=payload.org,
        bin_val=payload.bin,
        expire_date=payload.expireDate,
        role=payload.role
    )

@router.patch("/users/org")
def set_org(payload: TindaSetOrgDto):
    return TindaController.set_org(payload.user_id, payload.org)

@router.patch("/users/active")
def set_active(payload: TindaSetActiveDto):
    return TindaController.set_active(payload.user_id)

@router.patch("/users/bin")
def set_bin(payload: TindaSetBinDto):
    return TindaController.set_bin(payload.user_id, payload.bin)

@router.patch("/users/expire-date")
def set_expire_date(payload: TindaSetExpireDateDto):
    return TindaController.set_expire_date(payload.user_id, payload.expire_date)