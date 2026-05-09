from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.routers import recipes, ingredients
from app.database import engine, Base
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables (for development, Alembic is preferred for production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Recipe Manager API",
    description="A full-stack Recipe Manager application API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Custom exception handler for 500 errors
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "status_code": 500},
    )

# Include routers
app.include_router(recipes.router)
app.include_router(ingredients.router)

@app.get("/")
def root():
    return {"message": "Welcome to the Recipe Manager API", "docs": "/docs"}
