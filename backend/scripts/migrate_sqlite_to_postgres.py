"""
FinSentry AI - SQLite to PostgreSQL Database Migration Script.

This script exports all existing data (including all 337 demonstration transactions,
subscriptions, alerts, recommendations, and anomaly logs) from the local SQLite database
and safely inserts them into a target PostgreSQL database without data loss.

Usage:
    python backend/scripts/migrate_sqlite_to_postgres.py --target-url "postgresql://user:password@host:5432/finsentry"
"""

import sys
import os
import argparse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import Base
from app.models.models import (
    Transaction,
    Subscription,
    Alert,
    Recommendation,
    Budget,
    ChatMessage,
    ImportBatch,
    AnomalyLog,
)

def migrate_database(sqlite_path: str, postgres_url: str):
    print(f"[1/4] Connecting to source SQLite database: {sqlite_path}")
    if not os.path.exists(sqlite_path):
        print(f"Error: Source SQLite database not found at {sqlite_path}")
        sys.exit(1)

    sqlite_engine = create_engine(f"sqlite:///{sqlite_path}")
    SqliteSession = sessionmaker(bind=sqlite_engine)
    src_db = SqliteSession()

    print(f"[2/4] Connecting to target PostgreSQL database: {postgres_url}")
    pg_engine = create_engine(postgres_url)
    PgSession = sessionmaker(bind=pg_engine)
    dst_db = PgSession()

    print("[3/4] Creating database tables in PostgreSQL if not present...")
    Base.metadata.create_all(bind=pg_engine)

    models_to_migrate = [
        ("ImportBatch", ImportBatch),
        ("Transaction", Transaction),
        ("Subscription", Subscription),
        ("Alert", Alert),
        ("Recommendation", Recommendation),
        ("Budget", Budget),
        ("ChatMessage", ChatMessage),
        ("AnomalyLog", AnomalyLog),
    ]

    print("[4/4] Migrating table records...")
    total_migrated = 0
    for model_name, model_cls in models_to_migrate:
        records = src_db.query(model_cls).all()
        count = len(records)
        print(f" -> Migrating {model_name}: {count} records...")

        for rec in records:
            # Create a detached dictionary copy
            data = {c.name: getattr(rec, c.name) for c in rec.__table__.columns}
            new_rec = model_cls(**data)
            dst_db.merge(new_rec)
        
        dst_db.commit()
        total_migrated += count

    print(f"\n[SUCCESS] Successfully migrated {total_migrated} records to PostgreSQL!")
    src_db.close()
    dst_db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate FinSentry SQLite database to PostgreSQL")
    parser.add_argument(
        "--source",
        default="data/finsentry.db",
        help="Path to source SQLite database file (default: data/finsentry.db)"
    )
    parser.add_argument(
        "--target-url",
        required=True,
        help="Target PostgreSQL connection string (e.g. postgresql://user:pass@host/db)"
    )
    args = parser.parse_args()

    migrate_database(args.source, args.target_url)
