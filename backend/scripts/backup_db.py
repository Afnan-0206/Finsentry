import sqlite3
import os
import datetime

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(BACKEND_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "finsentry.db")
BACKUP_DIR = os.path.join(DATA_DIR, "backups")

def run_backup():
    print(f"Target DB Path: {DB_PATH}")
    if not os.path.exists(DB_PATH):
        raise FileNotFoundError(f"Database not found at {DB_PATH}")

    os.makedirs(BACKUP_DIR, exist_ok=True)

    # Check record counts
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    tables = [t[0] for t in cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").fetchall()]
    print("\n--- Current SQLite Records ---")
    record_counts = {}
    for t in tables:
        cnt = cur.execute(f"SELECT count(*) FROM {t}").fetchone()[0]
        record_counts[t] = cnt
        print(f"  {t}: {cnt}")
    conn.close()

    # Use SQLite native backup API
    ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(BACKUP_DIR, f"finsentry_backup_{ts}.db")
    src = sqlite3.connect(DB_PATH)
    dst = sqlite3.connect(backup_file)
    src.backup(dst)
    dst.close()
    src.close()

    print(f"\nCreated timestamped backup at: {backup_file}")
    print(f"Backup file size: {os.path.getsize(backup_file)} bytes")

    # Verify backup record counts match source exactly
    chk = sqlite3.connect(backup_file)
    chk_cur = chk.cursor()
    for t, expected_cnt in record_counts.items():
        actual_cnt = chk_cur.execute(f"SELECT count(*) FROM {t}").fetchone()[0]
        if actual_cnt != expected_cnt:
            raise RuntimeError(f"Backup mismatch for table {t}: expected {expected_cnt}, got {actual_cnt}")
    chk.close()
    print("Verification: All backup table record counts match active database 100%.")

if __name__ == "__main__":
    run_backup()

