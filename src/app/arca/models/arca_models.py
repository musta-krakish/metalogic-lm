from pydantic import BaseModel
from typing import Optional


class ArcaBaseMacDto(BaseModel):
    mac_address: str


class ArcaCreateLicenseDto(ArcaBaseMacDto):
    license_key: str
    license_date: str

    org: Optional[str] = None
    bin: Optional[str] = None


class ArcaDeleteLicenseDto(ArcaBaseMacDto):
    pass


class ArcaSetBinDto(ArcaBaseMacDto):
    bin: str


class ArcaSetOrgDto(ArcaBaseMacDto):
    org: str


class ArcaSetExpireDateDto(ArcaBaseMacDto):
    expire_date: str


class ArcaActiveDto(ArcaBaseMacDto):
    pass


class ArcaChangeLicenseDto(ArcaBaseMacDto):
    license_key: Optional[str] = None
    license_date: Optional[str] = None
    status: Optional[str] = None
    org: Optional[str] = None
    bin: Optional[str] = None
