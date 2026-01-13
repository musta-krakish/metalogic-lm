from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import StreamingResponse
from app.auth.auth import require_role
from app.auth.models.auth_models import UserRole
from app.kaspi.controllers.kaspi_controller import KaspiController
from app.kaspi.models.kaspi_models import KaspiCreateDto

router = APIRouter(
    prefix="/kaspi",
    tags=["kaspi"],
    dependencies=[Depends(require_role(UserRole.admin))]
)

@router.get("/users")
def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(50, le=500),
    search: str | None = None,
    status: str | None = None, # all, verified, unverified
):
    return KaspiController.get_users(
        page=page,
        limit=limit,
        search=search,
        status=status
    )

@router.post("/update")
def sync_users():
    KaspiController.sync_users()
    return {"status": "ok", "message": "Kaspi users synced from Mongo"}

@router.post("/users/create")
def create_user(payload: KaspiCreateDto):
    return KaspiController.create_user(payload.login, payload.password)

@router.get("/users/export")
def export_users(
    search: str | None = None,
    status: str | None = None
):
    try:
        excel, filename = KaspiController.export_users_to_excel(search=search, status=status)
        return StreamingResponse(
            excel,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))