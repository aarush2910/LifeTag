from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from app.core.config import settings
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode


raw_db_url = str(settings.DATABASE_URL)
# Normalize postgres:// to postgresql:// as injected by Render
if raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)
# Ensure asyncpg dialect is used when a plain postgresql:// URL is supplied
if raw_db_url.startswith("postgresql://") and "+asyncpg" not in raw_db_url:
    raw_db_url = raw_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

parts = urlsplit(raw_db_url)
query_kv = dict(parse_qsl(parts.query or ""))
connect_args = {
    "server_settings": {"search_path": "public"},
}

# If the URL contains sslmode or channel_binding, remove them from the URL
# and set an SSL/TLS connect argument for asyncpg. asyncpg expects an
# `ssl` parameter (SSLContext or True) rather than `sslmode`.
ssl_needed = False
if "sslmode" in query_kv or "channel_binding" in query_kv:
    ssl_needed = True
    # remove from query
    query_kv.pop("sslmode", None)
    query_kv.pop("channel_binding", None)

if ssl_needed:
    connect_args["ssl"] = True

new_query = urlencode(query_kv)
parts = parts._replace(query=new_query)
db_url = urlunsplit(parts)

engine = create_async_engine(
    db_url,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    poolclass=NullPool,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
