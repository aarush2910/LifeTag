from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
import ssl, os


CA_CERT_PATH = os.path.join(os.path.dirname(__file__), "../core/ca.pem")

ssl_context = ssl.create_default_context(cafile=CA_CERT_PATH)
ssl_context.check_hostname = True
ssl_context.verify_mode = ssl.CERT_REQUIRED


engine = create_async_engine(
    str(settings.DATABASE_URL),
    echo=settings.DEBUG,
    pool_pre_ping=True,
    connect_args={"ssl": ssl_context,
                  "server_settings":{"search_path":"public"}
                  },  
    
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
