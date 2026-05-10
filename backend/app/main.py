from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.database import engine, Base
from app.routers import auth, recipes, images, reviews, collections, admin_auth
from app.routers import comments, submissions, meal_planner, notifications, admin_dashboard
from app.config import settings
from fastapi.staticfiles import StaticFiles
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create upload dir
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


from app.database import engine, Base, verify_connection

async def lifespan(app: FastAPI):
    # Startup: ensure PostgreSQL connection succeeds
    logger.info("Connecting to PostgreSQL...")
    from sqlalchemy import text
    connected = False
    for i in range(5): # Retry up to 5 times
        try:
            async with engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
            connected = True
            logger.info("Successfully connected to PostgreSQL.")
            break
        except Exception as e:
            logger.error(f"Failed to connect to database (attempt {i+1}/5): {e}")
            import asyncio
            await asyncio.sleep(2)
    
    if not connected:
        logger.critical("Could not establish database connection. Exiting.")
        import sys
        sys.exit(1)
        
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(
    title="Recipe Manager API",
    description="Full-stack Recipe Manager API",
    version="1.0.0",
    lifespan=lifespan
)

allowed_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "status_code": 500},
    )

app.include_router(auth.router, prefix="/api/v1")
app.include_router(recipes.router, prefix="/api/v1")
app.include_router(images.router, prefix="/api/v1")
app.include_router(reviews.router, prefix="/api/v1")
app.include_router(collections.router, prefix="/api/v1")
app.include_router(comments.router, prefix="/api/v1")
app.include_router(comments.admin_router, prefix="/api/v1")
app.include_router(submissions.router, prefix="/api/v1")
app.include_router(submissions.admin_router, prefix="/api/v1")
app.include_router(meal_planner.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(admin_dashboard.router, prefix="/api/v1")
app.include_router(admin_auth.router, prefix="/api/v1")

# Mount static files for local images
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

from fastapi.responses import FileResponse
from pathlib import Path

# Try to serve assets natively to allow caching
static_path = Path("static")
if static_path.exists() and (static_path / "assets").exists():
    app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")
    
# Also mount public static files if needed (like vite.svg)
# We handle the rest in the catch-all.

@app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
async def serve_spa(request: Request, full_path: str):
    if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json") or full_path.startswith("uploads/"):
        return JSONResponse({"detail": "Not Found"}, status_code=404)
        
    path = static_path / full_path
    if path.is_file():
        return FileResponse(path)
        
    index_path = static_path / "index.html"
    if index_path.is_file():
        return FileResponse(index_path)
        
    return {"message": "Welcome to the Recipe Manager API (Frontend not built)", "docs": "/docs"}
