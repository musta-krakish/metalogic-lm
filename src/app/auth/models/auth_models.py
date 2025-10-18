from pydantic import BaseModel
from enum import Enum

class UserRole(str, Enum):
    admin = "admin"
    manager = "manager"
    partner = "partner"

class UserBase(BaseModel):
    email: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    class Config:
        orm_mode = True
