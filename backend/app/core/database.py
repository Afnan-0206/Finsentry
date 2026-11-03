import os
from pathlib import Path
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine, make_url
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

# ---------------------------------------------------------------------------
# Stable absolute directory anchors based on backend project directory.
# This ensures that running Uvicorn from any working directory (e.g. project root,
# backend directory, or external launcher) always points to the exact same file.
# ---------------------------------------------------------------------------
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = (BACKEND_DIR / "data").resolve()
DATA_DIR.mkdir(parents=True, exist_ok=True)
DEFAULT_SQLITE_PATH = (DATA_DIR / "finsentry.db").resolve()

def resolve_database_url(raw_url: str) -> str:
    """
    Resolve and normalize the database URL to an absolute SQLite path
    guaranteeing local persistence at backend/data/finsentry.db.
    """
    url_str = (raw_url or "").strip()
    
    # If unset or standard relative SQLite path, bind strictly to DEFAULT_SQLITE_PATH
    if (
        not url_str
        or url_str == "sqlite:///./data/finsentry.db"
        or url_str == "sqlite:///./finsentry.db"
        or url_str == "sqlite:///finsentry.db"
        or url_str.startswith("sqlite:///./")
    ):
        return f"sqlite:///{DEFAULT_SQLITE_PATH.as_posix()}"
    
    # Support postgresql if explicitly configured in cloud environments
    if url_str.startswith("postgres://"):
        return "postgresql://" + url_str[len("postgres://"):]
    
    return url_str

SQLALCHEMY_DATABASE_URL = resolve_database_url(settings.DATABASE_URL)
database_url = make_url(SQLALCHEMY_DATABASE_URL)

engine_options = {}

if database_url.get_backend_name() == "sqlite":
    # Ensure parent directory exists
    if database_url.database and database_url.database != ":memory:":
        db_file = Path(database_url.database)
        db_file.parent.mkdir(parents=True, exist_ok=True)
    
    # SQLite-specific settings for multi-threaded FastAPI concurrency
    engine_options["connect_args"] = {"check_same_thread": False}
else:
    engine_options.update({
        "pool_pre_ping": True,
        "pool_size": 2,
        "max_overflow": 1,
        "pool_recycle": 300,
    })

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_options)

# Enable Foreign Keys and Write-Ahead Logging (WAL) for high concurrency and crash resilience
if database_url.get_backend_name() == "sqlite":
    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        try:
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=NORMAL")
        except Exception:
            pass
        finally:
            cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
