from datetime import date, datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas import FeedbackCreate

router = APIRouter(prefix="/feedback", tags=["feedback"])


async def _update_streak(db, user_id: str, today: str):
    cursor = await db.execute(
        "SELECT current_streak, longest_streak, last_review_date FROM streaks WHERE user_id = ?",
        (user_id,),
    )
    streak_row = await cursor.fetchone()

    if not streak_row:
        streak_id = str(uuid4())
        await db.execute(
            "INSERT INTO streaks (id, user_id, current_streak, longest_streak, last_review_date) VALUES (?, ?, 1, 1, ?)",
            (streak_id, user_id, today),
        )
        return

    current_streak = streak_row["current_streak"]
    longest_streak = streak_row["longest_streak"]
    last_review = streak_row["last_review_date"]

    if last_review == today:
        return

    if last_review:
        from datetime import timedelta

        last_date = date.fromisoformat(last_review)
        today_date = date.fromisoformat(today)
        diff = (today_date - last_date).days

        if diff == 1:
            current_streak += 1
        elif diff > 1:
            current_streak = 1
    else:
        current_streak = 1

    if current_streak > longest_streak:
        longest_streak = current_streak

    await db.execute(
        "UPDATE streaks SET current_streak = ?, longest_streak = ?, last_review_date = ? WHERE user_id = ?",
        (current_streak, longest_streak, today, user_id),
    )


async def _update_daily_completion(db, user_id: str, today: str, briefing_id: str):
    cursor = await db.execute(
        "SELECT COUNT(*) as total FROM cards WHERE briefing_id = ?",
        (briefing_id,),
    )
    total_row = await cursor.fetchone()
    cards_total = total_row["total"] if total_row else 0

    cursor = await db.execute(
        """SELECT COUNT(*) as reviewed FROM feedback f
           JOIN cards c ON f.card_id = c.id
           WHERE f.user_id = ? AND c.briefing_id = ?""",
        (user_id, briefing_id),
    )
    reviewed_row = await cursor.fetchone()
    cards_reviewed = reviewed_row["reviewed"] if reviewed_row else 0

    cursor = await db.execute(
        "SELECT id FROM daily_completions WHERE user_id = ? AND date = ?",
        (user_id, today),
    )
    existing = await cursor.fetchone()

    if existing:
        await db.execute(
            "UPDATE daily_completions SET cards_reviewed = ?, cards_total = ? WHERE id = ?",
            (cards_reviewed, cards_total, existing["id"]),
        )
    else:
        comp_id = str(uuid4())
        await db.execute(
            "INSERT INTO daily_completions (id, user_id, date, cards_reviewed, cards_total) VALUES (?, ?, ?, ?, ?)",
            (comp_id, user_id, today, cards_reviewed, cards_total),
        )

    if cards_reviewed >= cards_total and cards_total > 0:
        await _update_streak(db, user_id, today)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_feedback(
    req: FeedbackCreate, user_id: str = Depends(get_current_user)
):
    today = date.today().isoformat()

    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id, briefing_id FROM cards WHERE id = ?", (req.card_id,)
        )
        card_row = await cursor.fetchone()
        if not card_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Card not found"
            )

        briefing_id = card_row["briefing_id"]

        cursor = await db.execute(
            "SELECT id FROM briefings WHERE id = ? AND user_id = ?",
            (briefing_id, user_id),
        )
        if not await cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Card does not belong to your briefing",
            )

        cursor = await db.execute(
            "SELECT id FROM feedback WHERE user_id = ? AND card_id = ?",
            (user_id, req.card_id),
        )
        existing = await cursor.fetchone()

        if existing:
            await db.execute(
                "UPDATE feedback SET action = ?, created_at = ? WHERE id = ?",
                (req.action, datetime.utcnow().isoformat(), existing["id"]),
            )
        else:
            feedback_id = str(uuid4())
            await db.execute(
                "INSERT INTO feedback (id, user_id, card_id, action, created_at) VALUES (?, ?, ?, ?, ?)",
                (feedback_id, user_id, req.card_id, req.action, datetime.utcnow().isoformat()),
            )

        await _update_daily_completion(db, user_id, today, briefing_id)
        await db.commit()

    return {"status": "ok"}
