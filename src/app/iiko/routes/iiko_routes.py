from fastapi import APIRouter, Depends, Query, HTTPException
from app.iiko.controllers.iiko_controller import IikoController
from app.iiko.controllers.iiko_scheduler import IikoScheduler
from app.auth.auth import require_role, get_current_user
from app.auth.models.auth_models import UserRole
from fastapi.responses import StreamingResponse

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

@router.post("/license/create")
def create_license(uid: str, title: str):
    return IikoController.create_license(uid, title)

@router.post("/license/verify")
def verify_license(license_code: str):
    return IikoController.verify_license(license_code)
