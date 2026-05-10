from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse
import logging

logger = logging.getLogger(__name__)

DATABASE_URL = settings.DATABASE_URL
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

# Neon and some other providers use 'sslmode' in the query string
# asyncpg expects 'ssl' parameter
if "postgresql+asyncpg://" in DATABASE_URL:
    parsed = urlparse(DATABASE_URL)
    query = dict(parse_qsl(parsed.query))
    
    if "sslmode" in query:
        # asyncpg uses 'ssl' instead of 'sslmode'
        # 'require' or 'verify-full' usually maps to True or a context
        query["ssl"] = "require"
        query.pop("sslmode", None)
    
    # Remove parameters that asyncpg doesn't support
    query.pop("channel_binding", None)
    
    DATABASE_URL = urlunparse(parsed._replace(query=urlencode(query)))

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    connect_args={
        "statement_cache_size": 0,
        "timeout": 20,  # asyncpg connect timeout in seconds
    }
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()

async def verify_connection():
    try:
        async with engine.connect() as conn:
            await conn.execute(Base.metadata.tables.get('users', Base.metadata).select().limit(1))
            logger.info("Database connection verified successfully.")
            return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False
