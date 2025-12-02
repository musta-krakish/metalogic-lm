from fastapi import APIRouter, Depends, Query, HTTPException
from app.iiko.controllers.iiko_controller import IikoController
from app.iiko.controllers.iiko_scheduler import IikoScheduler
from app.auth.auth import require_role, get_current_user
from app.auth.models.auth_models import UserRole
from fastapi.responses import StreamingResponse
from app.iiko.models.iiko_models import CreateLicenseDto, VerifyLicenseDto
from fastapi import Path

router = APIRouter(
    prefix="/iiko",
    tags=["iiko"],
    dependencies=[Depends(require_role(UserRole.admin))]
)


@router.get("/licenses")
def get_licenses(
        page: int = Query(1, ge=1),
        limit: int = Query(10, le=100),
        search: str = Query(None),
        status: str = Query("all"),
        organization_id: str = Query(None),
        is_online: bool = Query(None),
        sort_by: str = Query("updated_at"),
        sort_order: str = Query("desc")
):
    return IikoController.get_licenses(
        page=page,
        limit=limit,
        search=search,
        status=status,
        organization_id=organization_id,
        is_online=is_online,
        sort_by=sort_by,
        sort_order=sort_order
    )


@router.get("/licenses/export")
def export_licenses(
        search: str = Query(None),
        status: str = Query("all"),
        organization_id: str = Query(None),
        is_online: bool = Query(None)
):
    try:
        excel_file, filename = IikoController.export_licenses_to_excel(
            search=search,
            status=status,
            organization_id=organization_id,
            is_online=is_online
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


@router.post("/update")
def update_iiko():
    IikoScheduler.update_licenses()
    return {"status": "ok", "message": "iiko licenses updated"}

# как буд то не работает
@router.post("/license/create")
def create_license(payload: CreateLicenseDto):
    return IikoController.create_license(**payload.dict())

# Ставит поля isOnline и isEnabled в статус true, но только со второго раза, хз почему
# Сюда кидаем licenseCode в JSON body
@router.post("/license/verify")
def verify_license(payload: VerifyLicenseDto):
    return IikoController.verify_license(**payload.dict())

# В эти кидать license.id он сидит под полем isOnline
@router.post("/license/{license_id}/activate")
def activate_license(license_id: str = Path(...)):
    return IikoController.activate_license(license_id)

@router.post("/license/{license_id}/deactivate")
def deactivate_license(license_id: str = Path(...)):
    return IikoController.deactivate_license(license_id)