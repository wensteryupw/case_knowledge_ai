import sqlite3
from contextlib import contextmanager
from backend.config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS cases (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),

    settlement_filename TEXT NOT NULL,
    settlement_path     TEXT NOT NULL,
    settlement_media_type TEXT NOT NULL,

    bid_filename    TEXT,
    bid_path        TEXT,
    bid_media_type  TEXT,
    has_bid         INTEGER NOT NULL DEFAULT 0,

    settlement_text TEXT,
    bid_text        TEXT,

    analysis_json   TEXT,
    analysis_status TEXT NOT NULL DEFAULT 'pending',
    analysis_error  TEXT,

    case_name       TEXT,
    case_number     TEXT,
    jurisdiction    TEXT,
    settlement_type TEXT
);
"""


def init_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA journal_mode=WAL")
    conn.executescript(SCHEMA)
    conn.close()


def get_db():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
