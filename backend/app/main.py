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
                # Create tables if they don't exist
                await conn.run_sync(Base.metadata.create_all)
            connected = True
            logger.info("Successfully connected to PostgreSQL and initialized tables.")
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

# --- Static File Serving ---
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path
import os

static_dir = Path(__file__).resolve().parents[1] / "static"
uploads_dir = Path(settings.UPLOAD_DIR)

# Ensure directories exist
os.makedirs(uploads_dir, exist_ok=True)
logger.info(f"Static directory set to: {static_dir}")
logger.info(f"Static directory exists: {static_dir.exists()}")

# 1. Serve Uploads
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# 2. Serve Assets (CSS/JS)
if (static_dir / "assets").exists():
    app.mount("/assets", StaticFiles(directory=static_dir / "assets"), name="assets")

# 3. Root and SPA Catch-all
@app.get("/")
async def serve_index():
    index_path = static_dir / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return JSONResponse({"message": "Frontend index.html not found.", "path": str(index_path)}, status_code=404)

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # Skip API and docs
    if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
        return JSONResponse({"detail": "Not Found"}, status_code=404)
        
    # Check if the file exists in static directory
    file_path = static_dir / full_path
    if file_path.is_file():
        return FileResponse(file_path)
        
    # Default to index.html for SPA routing
    index_path = static_dir / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
        
    return JSONResponse({"message": f"Path '{full_path}' not found and no index.html available."}, status_code=404)
