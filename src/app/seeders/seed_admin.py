from app.database.database import SessionLocal, engine, Base
from app.database.schemas import User, UserRole
from app.auth.auth import get_password_hash

def run_seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    users = [
        ("admin@example.com", "admin123", UserRole.admin),
        ("manager@example.com", "manager123", UserRole.manager),
        ("partner@example.com", "partner123", UserRole.partner),
    ]

    for email, password, role in users:
        if not db.query(User).filter(User.email == email).first():
            u = User(email=email, hashed_password=get_password_hash(password), role=role)
            db.add(u)
            print(f"✅ Created {role} user: {email}")
    db.commit()
