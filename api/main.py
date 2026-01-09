from fastapi import FastAPI 
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, users, traefik
from core.config import settings 
from fastapi import APIRouter
from fastapi.responses import FileResponse
from pathlib import Path


app = FastAPI()
WEB_DIR = Path("./web")

origins = [
    settings.tpm_panel_url
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 

api_router = APIRouter(prefix="/api")  

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(traefik.router)


app.include_router(api_router)
 


# Static assets (Vite)
app.mount(
    "/assets",
    StaticFiles(directory=WEB_DIR / "assets"),
    name="assets",
)

# SPA fallback (React Router fix)
@app.get("/{full_path:path}")
async def spa_fallback(full_path: str):
    return FileResponse(WEB_DIR / "index.html")
 