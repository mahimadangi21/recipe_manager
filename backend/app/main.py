from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
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


from app.database import engine, Base, AsyncSessionLocal, get_db
from sqlalchemy.ext.asyncio import AsyncSession

# --- Production Safety & Seeding ---
async def validate_db_tables():
    """Verify that required tables exist in the database."""
    from sqlalchemy import inspect
    
    async with engine.connect() as conn:
        def check_tables(sync_conn):
            inspector = inspect(sync_conn)
            return inspector.get_table_names()
        
        tables = await conn.run_sync(check_tables)
        logger.info(f"Database connected. Found tables: {', '.join(tables)}")
        
        if 'users' not in tables or 'recipes' not in tables:
            logger.warning("Required tables 'users' or 'recipes' are missing.")
            return False
        return True

async def check_and_seed_admin():
    """Ensure at least one admin user exists based on environment variables."""
    from app.models.user import User
    from app.services.auth_service import get_password_hash
    from sqlalchemy.future import select
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.role == "admin"))
        admin = result.scalars().first()
        
        if not admin:
            logger.info(f"No admin found. Seeding default admin: {settings.ADMIN_EMAIL}")
            new_admin = User(
                username="admin",
                email=settings.ADMIN_EMAIL,
                hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
                role="admin",
                is_active=True
            )
            session.add(new_admin)
            await session.commit()
            logger.info("Admin seed checked: NEW ADMIN CREATED")
        else:
            logger.info(f"Admin seed checked: Admin already exists ({admin.email})")

async def check_recipe_count():
    """Log the count of recipes and warn if empty."""
    from app.models.recipe import Recipe
    from sqlalchemy import func, select
    
    async with AsyncSessionLocal() as session:
        count = await session.scalar(select(func.count(Recipe.id)))
        logger.info(f"Recipe table checked: {count} recipes found")
        if count == 0:
            logger.warning("No recipes found in production database")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    logger.info("Starting up RecipeManager Production Server...")
    
    # 1. Run Migrations / Create Tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # 2. Validate & Log
    await validate_db_tables()
    await check_and_seed_admin()
    await check_recipe_count()
    
    yield
    # Shutdown logic
    await engine.dispose()
    logger.info("Shutting down...")

app = FastAPI(
    title="RecipeManager API",
    description="Full-stack Recipe Management System",
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

@app.get("/api/recipes")
async def get_all_recipes_legacy(db: AsyncSession = Depends(get_db)):
    from app.routers.recipes import list_recipes
    # We call the existing logic
    return await list_recipes(db=db)

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
