from pydantic import BaseModel
from typing import Optional
from datetime import datetime

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    pin_hash TEXT NOT NULL,
    cards_per_briefing INTEGER NOT NULL DEFAULT 10,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    weight REAL NOT NULL DEFAULT 1.0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS briefings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    generated_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    briefing_id TEXT NOT NULL,
    category_name TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    source_url TEXT NOT NULL DEFAULT '',
    source_name TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (briefing_id) REFERENCES briefings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    card_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('thumbs_up', 'thumbs_down', 'skip')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
    UNIQUE(user_id, card_id)
);

CREATE TABLE IF NOT EXISTS streaks (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_review_date TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_completions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    cards_reviewed INTEGER NOT NULL DEFAULT 0,
    cards_total INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, date)
);
"""


class User(BaseModel):
    id: str
    name: str
    pin_hash: str
    cards_per_briefing: int = 10
    created_at: datetime


class Category(BaseModel):
    id: str
    user_id: str
    name: str
    weight: float = 1.0
    is_active: bool = True
    created_at: datetime


class Briefing(BaseModel):
    id: str
    user_id: str
    date: str
    generated_at: datetime


class Card(BaseModel):
    id: str
    briefing_id: str
    category_name: str
    title: str
    summary: str
    source_url: str = ""
    source_name: str = ""
    position: int = 0
    created_at: datetime


class Feedback(BaseModel):
    id: str
    user_id: str
    card_id: str
    action: str
    created_at: datetime


class Streak(BaseModel):
    id: str
    user_id: str
    current_streak: int = 0
    longest_streak: int = 0
    last_review_date: Optional[str] = None


class DailyCompletion(BaseModel):
    id: str
    user_id: str
    date: str
    cards_reviewed: int = 0
    cards_total: int = 0
