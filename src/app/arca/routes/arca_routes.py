from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from app.arca.controllers.arca_controller import ArcaController
from app.arca.controllers.arca_scheduler import ArcaScheduler
from app.auth.auth import require_role
from app.auth.models.auth_models import UserRole
from app.arca.models.arca_models import (
    ArcaCreateLicenseDto,
    ArcaDeleteLicenseDto,
    ArcaSetBinDto,
    ArcaSetOrgDto,
    ArcaSetExpireDateDto,
    ArcaActiveDto,
    ArcaChangeLicenseDto,
)

router = APIRouter(
    prefix="/arca",
    tags=["arca"],
    dependencies=[Depends(require_role(UserRole.admin))],
)


@router.get("/licenses")
def get_licenses(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    search: str | None = None,
    status: str | None = None,
    org: str | None = None,
    bin: str | None = None,
):
    return ArcaController.get_licenses(
        page=page,
        limit=limit,
        search=search,
        status=status,
        org=org,
        bin_value=bin,
    )


@router.post("/update")
def update_licenses():
    ArcaScheduler.update_licenses()
    return {"status": "ok", "message": "ARCA licenses updated"}


@router.get("/licenses/export")
def export_licenses(
    search: str | None = None,
    status: str | None = None,
    org: str | None = None,
    bin: str | None = None,
):
    try:
        excel, filename = ArcaController.export_licenses_to_excel(
            search=search,
            status=status,
            org=org,
            bin_value=bin,
        )
        return StreamingResponse(
            excel,
            media_type=(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            ),
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/license/create")
def create_license(payload: ArcaCreateLicenseDto):
    return ArcaController.create_license(
        mac=payload.mac_address,
        key=payload.license_key,
        date=payload.license_date,
        org=payload.org,
        bin_code=payload.bin,
    )


@router.post("/license/delete")
def delete_license(payload: ArcaDeleteLicenseDto):
    return ArcaController.delete_license(payload.mac_address)


@router.patch("/license/bin")
def set_bin(payload: ArcaSetBinDto):
    return ArcaController.set_bin(payload.mac_address, payload.bin)


@router.patch("/license/org")
def set_org(payload: ArcaSetOrgDto):
    return ArcaController.set_org(payload.mac_address, payload.org)


@router.patch("/license/expire-date")
def set_expire_date(payload: ArcaSetExpireDateDto):
    return ArcaController.set_expire_date(payload.mac_address, payload.expire_date)

# этот endpoint ставит status на противоположный
@router.patch("/license/active")
def set_active(payload: ArcaActiveDto):
    return ArcaController.set_active(payload.mac_address)


@router.patch("/license/change")
def change_license(payload: ArcaChangeLicenseDto):
    return ArcaController.change_license(
        mac_address=payload.mac_address,
        license_key=payload.license_key,
        license_date=payload.license_date,
        status=payload.status,
        org=payload.org,
        bin_code=payload.bin,
        expire_date=payload.expire_date
    )