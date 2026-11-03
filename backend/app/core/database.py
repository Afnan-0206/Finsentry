import os

from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings


SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL.strip()
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = "postgresql://" + SQLALCHEMY_DATABASE_URL[len("postgres://"):]

database_url = make_url(SQLALCHEMY_DATABASE_URL)
engine_options = {"pool_pre_ping": True}

if database_url.get_backend_name() == "sqlite":
    if database_url.database and database_url.database != ":memory:":
        os.makedirs(os.path.dirname(os.path.abspath(database_url.database)), exist_ok=True)
    engine_options["connect_args"] = {"check_same_thread": False}
else:
    engine_options.update({
        "pool_size": 2,
        "max_overflow": 1,
        "pool_recycle": 300,
    })

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_options)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()