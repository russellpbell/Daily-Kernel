from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


# Auth
class RegisterRequest(BaseModel):
    name: str
    pin: str


class LoginRequest(BaseModel):
    name: str
    pin: str


class AuthResponse(BaseModel):
    user_id: str
    token: str
    name: str


# Categories
class CategoryCreate(BaseModel):
    name: str
    weight: float = 1.0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    weight: Optional[float] = None
    is_active: Optional[bool] = None


class CategoryResponse(BaseModel):
    id: str
    name: str
    weight: float
    is_active: bool


# Cards & Briefings
class CardResponse(BaseModel):
    id: str
    category_name: str
    title: str
    summary: str
    source_url: str
    source_name: str
    position: int
    feedback: Optional[str] = None


class BriefingResponse(BaseModel):
    id: str
    date: str
    cards: list[CardResponse]
    generated_at: datetime


# Feedback
class FeedbackCreate(BaseModel):
    card_id: str
    action: Literal["thumbs_up", "thumbs_down", "skip"]


# Settings
class SettingsResponse(BaseModel):
    cards_per_briefing: int


class SettingsUpdate(BaseModel):
    cards_per_briefing: Optional[int] = None


# Stats
class DailyCompletionResponse(BaseModel):
    date: str
    cards_reviewed: int
    cards_total: int


class StatsResponse(BaseModel):
    current_streak: int
    longest_streak: int
    last_review_date: Optional[str]
    monthly_completions: list[DailyCompletionResponse]
