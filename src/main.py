import os
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

from app.auth.routes.auth_routes import router as auth_router
from app.iiko.routes.iiko_routes import router as iiko_router
from app.logs.routes.logs_routes import router as logs_router
from app.database.database import Base, engine
from app.seeders.seed_admin import run_seed

app = FastAPI(title="Integration & License Manager API")

# Создание таблиц и seed
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    run_seed()

# API роутеры
app.include_router(auth_router, prefix="/api")
app.include_router(iiko_router, prefix="/api")
app.include_router(logs_router, prefix="/api")

# Разрешаем фронту обращаться к API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # при деплое лучше ограничить
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Раздача собранного React SPA
frontend_dir = os.path.join(os.path.dirname(__file__), "client_dist")
if os.path.exists(frontend_dir):
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")

@app.get("/{full_path:path}")
async def serve_react(full_path: str):
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"detail": "Frontend not built"}

@app.get("/")
def root():
    return {"status": "ok", "message": "API is running"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
