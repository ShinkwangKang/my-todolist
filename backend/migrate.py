"""Database migration script for adding archive columns to todos table."""
import sqlite3
import sys
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "todolist.db")


def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check existing columns
    cursor.execute("PRAGMA table_info(todos)")
    columns = {row[1] for row in cursor.fetchall()}

    if "is_archived" not in columns:
        print("Adding is_archived column...")
        cursor.execute("ALTER TABLE todos ADD COLUMN is_archived BOOLEAN DEFAULT 0")

    if "archived_at" not in columns:
        print("Adding archived_at column...")
        cursor.execute("ALTER TABLE todos ADD COLUMN archived_at DATETIME")

    conn.commit()
    conn.close()
    print("Migration complete.")


if __name__ == "__main__":
    migrate()
