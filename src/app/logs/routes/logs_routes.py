from fastapi import APIRouter, Query, Depends
from app.logs.controllers.logs_controller import LogsController
from app.auth.auth import require_role
from app.auth.models.auth_models import UserRole

router = APIRouter(
    prefix="/logs",
    tags=["logs"],
    dependencies=[Depends(require_role(UserRole.admin))]
)

@router.get("/")
def get_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=200),
    level: str | None = Query(None),
    search: str | None = Query(None)
):
    """Получить логи системы (только для админов)"""
    return LogsController.get_logs(page, limit, level, search)
