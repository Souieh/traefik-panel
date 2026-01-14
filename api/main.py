import logging
from pathlib import Path
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from core.config import settings
from routers import auth, users, traefik
from scripts.configure_traefik_api import ensure_traefik_api_config
from core.database import init_db

# ------------------------
# Logging
# ------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("tpm-panel")

# ------------------------
# Ensure Traefik API config
# ------------------------
try:
    ensure_traefik_api_config()
    logger.info("Traefik API dynamic router ensured.")
except Exception as e:
    logger.exception("Failed to ensure Traefik API config")
    raise  # crash startup if config fails

# ------------------------
# FastAPI app setup
# ------------------------
app = FastAPI(title="TPM Panel")

@app.on_event("startup")
async def startup_event():
    logger.info("Checking for initial user...")
    init_db()

# CORS
origins = [settings.tp_panel_url]  # only allow panel frontend domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(traefik.router)  # ensure secure
app.include_router(api_router)

# ------------------------
# Static files (Vite build)
# ------------------------
WEB_DIR = Path("./web")
ASSETS_DIR = WEB_DIR / "assets"

if ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")
    logger.info(f"Static assets mounted at /assets from {ASSETS_DIR}")
else:
    logger.warning(f"Static assets directory not found: {ASSETS_DIR}")

# SPA fallback (React Router)
@app.get("/{full_path:path}")
async def spa_fallback(full_path: str):
    index_file = WEB_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file, media_type="text/html")
    logger.error(f"SPA index.html not found at {index_file}")
    return {"error": "index.html not found"}

# ------------------------
# Health check endpoint
# ------------------------
@app.get("/healthz")
async def health_check():
    return {"status": "ok"}
