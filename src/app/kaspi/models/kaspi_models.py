from pydantic import BaseModel
from typing import Optional

class KaspiCreateDto(BaseModel):
    login: str
    password: str

class KaspiUserDto(BaseModel):
    mongo_id: str
    login: str
    role: int
    is_verified: bool
    created_at: Optional[str] = None