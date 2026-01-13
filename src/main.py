import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.core.custom_logger import LoggedFastAPI
from app.database.database import Base, engine
from app.seeders.seed_admin import run_seed

from app.auth.routes.auth_routes import router as auth_router
from app.iiko.routes.iiko_routes import router as iiko_router
from app.logs.routes.logs_routes import router as logs_router
from app.tinda.routes.tinda_routes import router as tinda_router
from app.arca.routes.arca_routes import router as arca_router
from app.tsd.routes.tsd_routes import router as tsd_router
from app.kaspi.routes.kaspi_routes import router as kaspi_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_seed()
    yield


app = LoggedFastAPI(
    title="Integration & License Manager API",
    lifespan=lifespan
)

# ---------- API ----------
app.include_router(auth_router, prefix="/api")
app.include_router(iiko_router, prefix="/api")
app.include_router(logs_router, prefix="/api")
app.include_router(tinda_router, prefix="/api")
app.include_router(arca_router, prefix="/api")
app.include_router(tsd_router, prefix="/api")
app.include_router(kaspi_router, prefix="/api")

# ---------- CORS ----------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- FRONTEND ----------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "client_dist")

if os.path.exists(FRONTEND_DIR):
    app.mount(
        "/assets",
        StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")),
        name="assets"
    )

    @app.get("/", include_in_schema=False)
    async def serve_index():
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        index_path = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"detail": "Frontend not built"}


# --------- HEALTH ---------
@app.get("/health", include_in_schema=False)
def health():
    return {"status": "ok"}
