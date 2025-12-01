from pydantic import BaseModel
from typing import Optional


class TindaBaseDto(BaseModel):
    user_id: str

class TindaCreateUserDto(BaseModel):
    username: str
    password: str
    org: Optional[str] = ""
    bin: Optional[str] = ""
    expireDate: str
    role: Optional[int] = 1


class TindaSetOrgDto(BaseModel):
    user_id: str
    org: str


class TindaSetBinDto(BaseModel):
    user_id: str
    bin: str


class TindaSetExpireDateDto(BaseModel):
    user_id: str
    expire_date: str


class TindaSetActiveDto(BaseModel):
    user_id: str