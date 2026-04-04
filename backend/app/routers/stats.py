from datetime import date, timedelta

from fastapi import APIRouter, Depends

from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas import DailyCompletionResponse, StatsResponse

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("/", response_model=StatsResponse)
async def get_stats(user_id: str = Depends(get_current_user)):
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT current_streak, longest_streak, last_review_date FROM streaks WHERE user_id = ?",
            (user_id,),
        )
        streak_row = await cursor.fetchone()

        current_streak = 0
        longest_streak = 0
        last_review_date = None

        if streak_row:
            current_streak = streak_row["current_streak"]
            longest_streak = streak_row["longest_streak"]
            last_review_date = streak_row["last_review_date"]

        thirty_days_ago = (date.today() - timedelta(days=30)).isoformat()
        cursor = await db.execute(
            "SELECT date, cards_reviewed, cards_total FROM daily_completions WHERE user_id = ? AND date >= ? ORDER BY date DESC",
            (user_id, thirty_days_ago),
        )
        completion_rows = await cursor.fetchall()

    monthly_completions = [
        DailyCompletionResponse(
            date=row["date"],
            cards_reviewed=row["cards_reviewed"],
            cards_total=row["cards_total"],
        )
        for row in completion_rows
    ]

    return StatsResponse(
        current_streak=current_streak,
        longest_streak=longest_streak,
        last_review_date=last_review_date,
        monthly_completions=monthly_completions,
    )
