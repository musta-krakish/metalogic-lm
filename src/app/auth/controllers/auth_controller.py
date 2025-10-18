from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.auth.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_db,
)
from app.database.schemas import User, UserRole

class AuthController:
    @staticmethod
    def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
        user = db.query(User).filter(User.email == form_data.username).first()
        if not user or not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        token = create_access_token({"sub": user.email, "role": user.role})
        return {"access_token": token, "token_type": "bearer"}

    @staticmethod
    def register(email: str, password: str, role: UserRole, db: Session):
        if db.query(User).filter(User.email == email).first():
            raise HTTPException(status_code=400, detail="User already exists")
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            role=role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return {"message": f"User {email} created with role {role}"}
