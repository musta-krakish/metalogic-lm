from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.arca.controllers.arca_controller import ArcaController
from app.arca.controllers.arca_scheduler import ArcaScheduler
from app.auth.auth import require_role
from app.auth.models.auth_models import UserRole

router = APIRouter(
    prefix="/arca",
    tags=["arca"],
    dependencies=[require_role(UserRole.admin)]
)

@router.get("/licenses")
def get_licenses():
    return ArcaController.get_licenses()

@router.post("/update")
def update_licenses():
    ArcaScheduler.update_licenses()
    return {"status": "ok", "message": "ARCA licenses updated"}

@router.get("/licenses/export")
def export_licenses():
    try:
        excel, filename = ArcaController.export_licenses_to_excel()
        return StreamingResponse(
            excel,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except HTTPException:
        raise

@router.post("/license/create")
def create_license(mac: str, key: str, date: str):
    return ArcaController.create_license(mac, key, date)

@router.post("/license/delete")
def delete_license(mac: str):
    return ArcaController.delete_license(mac)