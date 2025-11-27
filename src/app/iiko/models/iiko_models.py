from pydantic import BaseModel


class CreateLicenseDto(BaseModel):
    uid: str
    title: str


class VerifyLicenseDto(BaseModel):
    license_code: str
