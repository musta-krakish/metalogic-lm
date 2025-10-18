from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.auth.controllers.auth_controller import AuthController
from app.auth.auth import get_db, get_current_user, require_role
from app.auth.models.auth_models import UserRole
from sqlalchemy.orm import Session

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    return AuthController.login(form_data, db)

@router.post("/register")
def register_user(email: str, password: str, role: UserRole, db: Session = Depends(get_db)):
    return AuthController.register(email, password, role, db)

@router.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return {"email": current_user.email, "role": current_user.role}
