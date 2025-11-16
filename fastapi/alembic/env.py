from logging.config import fileConfig
import os

from app.db.base import Base
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Allow overriding the DB URL via environment variable so credentials aren't stored
# in alembic.ini. If DATABASE_URL is set, write it into the config so the rest
# of this script uses it.
env_db_url = os.getenv("DATABASE_URL")

# If DATABASE_URL isn't set in the environment, try to load a local .env file
# (if python-dotenv is installed). This helps local development while keeping
# credentials out of version control. If neither is available, validate the
# value from alembic.ini and provide a clear error message instead of letting
# SQLAlchemy try to interpret a placeholder like DRIVER://...
if not env_db_url:
    try:
        # Attempt to import python-dotenv; it's optional and preferred.
        from dotenv import load_dotenv  # type: ignore

        # alembic/env.py lives in fastapi/alembic; repository root is two levels up
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        dotenv_path = os.path.join(project_root, ".env")
        if os.path.exists(dotenv_path):
            load_dotenv(dotenv_path)
            env_db_url = os.getenv("DATABASE_URL")
    except Exception:
        # python-dotenv not available; try a tiny, safe .env parser as a
        # fallback so local development works without extra deps.
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        dotenv_path = os.path.join(project_root, ".env")
        if os.path.exists(dotenv_path):
            try:
                import re

                resolved = {}
                # Read file and build a mapping of KEY->raw VALUE
                with open(dotenv_path, "r", encoding="utf-8") as fh:
                    for ln in fh:
                        ln = ln.strip()
                        if not ln or ln.startswith("#"):
                            continue
                        if "=" not in ln:
                            continue
                        k, v = ln.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip('\"').strip("\'")
                        resolved[k] = v

                # Resolve ${VAR} references iteratively up to a few passes
                pattern = re.compile(r"\$\{([^}]+)\}")
                for _ in range(5):
                    changed = False
                    for key, val in list(resolved.items()):
                        def _repl(m):
                            name = m.group(1)
                            return resolved.get(name, os.environ.get(name, ""))

                        new_val = pattern.sub(_repl, val)
                        if new_val != val:
                            resolved[key] = new_val
                            changed = True
                    if not changed:
                        break

                # Inject into environment so later getenv works
                for key, val in resolved.items():
                    if os.getenv(key) is None:
                        os.environ[key] = val

                env_db_url = os.getenv("DATABASE_URL")
            except Exception:
                env_db_url = None

if env_db_url:
    config.set_main_option("sqlalchemy.url", env_db_url)
else:
    # If alembic.ini contains a placeholder (used to avoid committing secrets),
    # provide a clear message rather than letting SQLAlchemy fail with a
    # confusing NoSuchModuleError for a fake DRIVER.
    cfg_url = config.get_main_option("sqlalchemy.url")
    if not cfg_url or "REPLACED_BY_ENV" in cfg_url or cfg_url.strip().upper().startswith("DRIVER"):
        raise RuntimeError(
            "Alembic is not configured with a valid database URL.\n"
            "Set the DATABASE_URL environment variable (or place a local .env file with DATABASE_URL)\n"
            "before running alembic commands. Example:\n"
            "  setx DATABASE_URL \"postgresql+psycopg2://user:pass@host:port/dbname\"\n"
        )

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # Use an async engine if the URL refers to an async driver (eg. +asyncpg).
    url = config.get_main_option("sqlalchemy.url")
    if url and "+async" in url:
        # Async migrations: create an AsyncEngine and run migrations inside
        # an asyncio event loop. We call run_sync() on the connection so the
        # standard (sync) migration API works.
        async_engine = create_async_engine(url, poolclass=pool.NullPool)

        async def do_run_async_migrations() -> None:
            async with async_engine.connect() as conn:
                await conn.run_sync(lambda connection: (
                    context.configure(connection=connection, target_metadata=target_metadata),
                    None
                ))
                # run migrations within a transaction
                await conn.run_sync(lambda connection: context.begin_transaction() or context.run_migrations())

        import asyncio

        asyncio.run(do_run_async_migrations())
        # dispose engine
        asyncio.run(async_engine.dispose())
    else:
        connectable = engine_from_config(
            config.get_section(config.config_ini_section, {}),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )

        with connectable.connect() as connection:
            context.configure(
                connection=connection, target_metadata=target_metadata
            )

            with context.begin_transaction():
                context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
