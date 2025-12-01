from pydantic import BaseModel
from typing import Optional


class TsdBaseUserDto(BaseModel):
    username: str


class TsdCreateUserDto(TsdBaseUserDto):
    password: str
    role: Optional[str] = "User"
    org: Optional[str] = None
    deviceID: Optional[str] = None
    deviceName: Optional[str] = None


class TsdSetPasswordDto(TsdBaseUserDto):
    password: str


class TsdSetDeviceCountDto(TsdBaseUserDto):
    count: int


class TsdSetBinDto(TsdBaseUserDto):
    bin: str


class TsdSetOrgDto(TsdBaseUserDto):
    org: str


class TsdSetExpireDateDto(TsdBaseUserDto):
    expire_date: str


class TsdActiveDto(TsdBaseUserDto):
    pass