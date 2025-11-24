from sqlalchemy import Column, Integer, String, Enum, DateTime, Text, JSON, func
from datetime import datetime
from .database import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    partner = "partner"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.partner, nullable=False)

class LogEntry(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(String, index=True)
    message = Column(Text)
    path = Column(String, nullable=True)
    method = Column(String, nullable=True)
    ip_address = Column(String, nullable=True, index=True)
    data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class LicenseIiko(Base):
    __tablename__ = "licenses_iiko"

    id = Column(Integer, primary_key=True, index=True)
    data = Column(JSON, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class LicenseArca(Base):
    __tablename__ = "licenses_arca"

    id = Column(Integer, primary_key=True, index=True)
    data = Column(JSON, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class TindaUser(Base):
    __tablename__ = "tinda_users"

    id = Column(Integer, primary_key=True, index=True)
    data = Column(JSON, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class TsdUser(Base):
    __tablename__ = "tsd_users"

    id = Column(Integer, primary_key=True, index=True)
    data = Column(JSON, nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())