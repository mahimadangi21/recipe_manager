from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse

DATABASE_URL = settings.DATABASE_URL
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

if DATABASE_URL.startswith("postgresql+asyncpg://"):
    parsed = urlparse(DATABASE_URL)
    query = dict(parse_qsl(parsed.query))
    # Neon URLs commonly include psycopg-style params not accepted by asyncpg.
    if "sslmode" in query:
        query["ssl"] = "require" if query["sslmode"] == "require" else query["sslmode"]
        query.pop("sslmode", None)
    query.pop("channel_binding", None)
    DATABASE_URL = urlunparse(parsed._replace(query=urlencode(query)))

engine = create_async_engine(
    DATABASE_URL,
    echo=True,
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
        finally:
            await session.close()
