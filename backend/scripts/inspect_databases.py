import os
import sqlite3

def check_db(path):
    print(f"\n==========================================")
    print(f"DB FILE: {path}")
    print(f"EXISTS: {os.path.exists(path)}")
    print(f"SIZE: {os.path.getsize(path)} bytes")
    print(f"==========================================")
    try:
        conn = sqlite3.connect(path)
        cur = conn.cursor()
        cur.execute("PRAGMA integrity_check;")
        integrity = cur.fetchall()
        print(f"PRAGMA integrity_check: {integrity}")
        
        cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [r[0] for r in cur.fetchall()]
        print(f"Tables ({len(tables)}): {tables}")
        
        counts = {}
        for t in tables:
            try:
                cur.execute(f'SELECT COUNT(*) FROM "{t}"')
                cnt = cur.fetchone()[0]
                counts[t] = cnt
                print(f"  - {t}: {cnt}")
            except Exception as e:
                print(f"  - {t}: ERROR {e}")
                
        if "chat_messages" in tables:
            cur.execute("SELECT id, role, substr(message, 1, 50), intent, created_at FROM chat_messages ORDER BY id")
            rows = cur.fetchall()
            print(f"  chat_messages rows ({len(rows)}):")
            for r in rows:
                print(f"    id={r[0]}, role={r[1]}, date={r[4]}, content={r[2]}")
                
        conn.close()
    except Exception as e:
        print(f"Failed to check {path}: {e}")

if __name__ == "__main__":
    db_paths = [
        r"backend\data\finsentry.db",
        r"data\finsentry.db",
    ]
    backup_dir = r"backend\data\backups"
    if os.path.exists(backup_dir):
        for f in sorted(os.listdir(backup_dir)):
            if f.endswith(".db"):
                db_paths.append(os.path.join(backup_dir, f))
                
    for p in db_paths:
        check_db(p)
