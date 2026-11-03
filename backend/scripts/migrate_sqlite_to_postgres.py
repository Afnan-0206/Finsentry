"""Copy local FinSentry SQLite data into a PostgreSQL database without deleting the source."""

import argparse
import os
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BACKEND_DIR)

from app.core.database import Base  # noqa: E402
from app.models.models import (  # noqa: E402
    Alert, AnomalyLog, Budget, ChatMessage, ImportBatch,
    Recommendation, Subscription, Transaction,
)


def migrate_database(sqlite_path: str, postgres_url: str) -> None:
    if not os.path.isfile(sqlite_path):
        raise FileNotFoundError(f"Source SQLite database not found: {sqlite_path}")

    target_url = postgres_url.strip()
    if target_url.startswith("postgres://"):
        target_url = "postgresql://" + target_url[len("postgres://"):]

    sqlite_engine = create_engine(
        f"sqlite:///{os.path.abspath(sqlite_path)}",
        connect_args={"check_same_thread": False},
    )
    pg_engine = create_engine(
        target_url,
        pool_pre_ping=True,
        pool_size=2,
        max_overflow=1,
    )
    SourceSession = sessionmaker(bind=sqlite_engine)
    TargetSession = sessionmaker(bind=pg_engine)
    source = SourceSession()
    target = TargetSession()

    models = [
        ("ImportBatch", ImportBatch),
        ("Transaction", Transaction),
        ("Subscription", Subscription),
        ("Alert", Alert),
        ("Recommendation", Recommendation),
        ("Budget", Budget),
        ("ChatMessage", ChatMessage),
        ("AnomalyLog", AnomalyLog),
    ]

    try:
        Base.metadata.create_all(bind=pg_engine)
        total = 0
        for name, model in models:
            rows = source.query(model).order_by(model.id).all()
            for row in rows:
                values = {column.name: getattr(row, column.name) for column in row.__table__.columns}
                target.merge(model(**values))
            target.commit()
            total += len(rows)
            print(f"{name}: copied {len(rows)} rows")

        print(f"Copied {total} rows across {len(models)} tables. Verifying counts...")
        for name, model in models:
            source_count = source.query(model).count()
            target_count = target.query(model).count()
            if source_count != target_count:
                raise RuntimeError(f"{name} count mismatch: source={source_count}, target={target_count}")
            print(f"{name}: verified {target_count} rows")
        print("Migration complete. The source SQLite database was not modified.")
    finally:
        source.close()
        target.close()
        sqlite_engine.dispose()
        pg_engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate FinSentry SQLite data to PostgreSQL")
    parser.add_argument(
        "--source",
        default=os.path.join(BACKEND_DIR, "data", "finsentry.db"),
        help="Source SQLite database path",
    )
    parser.add_argument("--target-url", required=True, help="Target PostgreSQL connection URL")
    args = parser.parse_args()
    migrate_database(args.source, args.target_url)