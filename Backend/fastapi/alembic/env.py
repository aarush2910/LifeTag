from logging.config import fileConfig
import os
import sys
import importlib
import pkgutil
from alembic import context
from sqlalchemy import engine_from_config, pool
from sqlalchemy.ext.asyncio import create_async_engine
from app.db.base import Base

# Ensure project root is on sys.path so 'app' imports work
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# ------------------------------------------------------------
# 1️⃣ Load environment variables from .env (auto)
# ------------------------------------------------------------
try:
    # If python-dotenv is installed, load the repository .env automatically.
    # This lets developers run `alembic` without manually passing a DB URL.
    from dotenv import load_dotenv  # type: ignore
    dotenv_path = os.path.join(project_root, ".env")
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path)
except Exception:
    # If python-dotenv isn't available, we fall back to reading real env vars.
    # This avoids brittle custom parsing and keeps behavior explicit.
    pass


# ------------------------------------------------------------
# 2️⃣ Determine which DB URL to use
# ------------------------------------------------------------
config = context.config
env_db_url = (
    os.getenv("ALEMBIC_DATABASE_URL")  # use sync driver for migrations
    or os.getenv("DATABASE_URL")       # fallback to async if only that exists
)

if env_db_url:
    # Normalize postgres:// to postgresql:// as injected by Render
    if env_db_url.startswith("postgres://"):
        env_db_url = env_db_url.replace("postgres://", "postgresql://", 1)
    # Force asyncpg driver if no driver is specified, avoiding psycopg2 requirement
    if env_db_url.startswith("postgresql://") and "+asyncpg" not in env_db_url:
        env_db_url = env_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    config.set_main_option("sqlalchemy.url", env_db_url)
else:
    cfg_url = config.get_main_option("sqlalchemy.url")
    if not cfg_url or "REPLACED_BY_ENV" in cfg_url or cfg_url.strip().upper().startswith("DRIVER"):
        raise RuntimeError(
            "❌ No valid database URL found.\n"
            "Set ALEMBIC_DATABASE_URL or DATABASE_URL in your .env file before running alembic."
        )

# ------------------------------------------------------------
# 3️⃣ Configure logging
# ------------------------------------------------------------
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ------------------------------------------------------------
# 4️⃣ Import all models so Base.metadata is populated
# ------------------------------------------------------------
try:
    import app.models as models_pkg
    for _, name, _ in pkgutil.iter_modules(models_pkg.__path__):
        try:
            importlib.import_module(f"{models_pkg.__name__}.{name}")
        except Exception:
            pass
except Exception:
    # fallback for specific models if dynamic import fails
    for mod in ("app.models.user", "app.models.farmer", "app.models.cattle", "app.models.vet", "app.models.appointment"):
        try:
            importlib.import_module(mod)
        except Exception:
            pass

target_metadata = Base.metadata

# ------------------------------------------------------------
# 5️⃣ Migration Runners
# ------------------------------------------------------------
def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=False,
        compare_server_default=False,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    url = config.get_main_option("sqlalchemy.url")

    if url and "+asyncpg" in url:
        # Async migrations (rarely used)
        async_engine = create_async_engine(url, poolclass=pool.NullPool)

        async def do_run_async_migrations() -> None:
            async with async_engine.connect() as conn:
                await conn.run_sync(
                    lambda connection: context.configure(
                        connection=connection,
                        target_metadata=target_metadata,
                        compare_type=False,
                        compare_server_default=False,
                    )
                )
                await conn.run_sync(lambda connection: context.begin_transaction() or context.run_migrations())

        import asyncio
        asyncio.run(do_run_async_migrations())
        asyncio.run(async_engine.dispose())
    else:
        # Standard sync migrations (using psycopg2)
        connectable = engine_from_config(
            config.get_section(config.config_ini_section, {}),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )

        with connectable.connect() as connection:
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                compare_type=True,
                compare_server_default=True,
            )

            with context.begin_transaction():
                context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
