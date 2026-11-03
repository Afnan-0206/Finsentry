import os
import sqlite3
import datetime
from pathlib import Path
from typing import Dict, Any, List

from app.core.database import DEFAULT_SQLITE_PATH, DATA_DIR

BACKUPS_DIR = (DATA_DIR / "backups").resolve()

class BackupService:
    @staticmethod
    def ensure_backup_dir() -> Path:
        BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
        return BACKUPS_DIR

    @staticmethod
    def create_backup() -> Dict[str, Any]:
        """
        Creates an atomic timestamped copy of finsentry.db using the native
        SQLite backup API without locking the database or interrupting reads/writes.
        """
        BackupService.ensure_backup_dir()
        
        if not DEFAULT_SQLITE_PATH.exists():
            raise FileNotFoundError(f"Active database not found at {DEFAULT_SQLITE_PATH}")

        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"finsentry_backup_{timestamp}.db"
        backup_path = BACKUPS_DIR / backup_filename

        # Use SQLite native backup API for consistency
        src = sqlite3.connect(str(DEFAULT_SQLITE_PATH))
        dst = sqlite3.connect(str(backup_path))
        try:
            src.backup(dst)
        finally:
            dst.close()
            src.close()

        # Audit record counts in the new backup
        chk = sqlite3.connect(str(backup_path))
        cur = chk.cursor()
        tables = [
            t[0] for t in cur.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            ).fetchall()
        ]
        counts = {}
        for t in tables:
            counts[t] = cur.execute(f"SELECT count(*) FROM {t}").fetchone()[0]
        chk.close()

        file_size = backup_path.stat().st_size

        return {
            "status": "success",
            "message": "Atomic database backup completed successfully.",
            "backup_filename": backup_filename,
            "backup_path": str(backup_path),
            "timestamp": timestamp,
            "size_bytes": file_size,
            "tables": counts,
        }

    @staticmethod
    def list_backups() -> List[Dict[str, Any]]:
        """
        Lists all existing backups without deleting any history.
        """
        BackupService.ensure_backup_dir()
        backups = []
        for f in sorted(BACKUPS_DIR.glob("finsentry_backup_*.db"), reverse=True):
            backups.append({
                "filename": f.name,
                "path": str(f.resolve()),
                "size_bytes": f.stat().st_size,
                "created_at": datetime.datetime.fromtimestamp(f.stat().st_ctime).isoformat(),
            })
        return backups

