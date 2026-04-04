from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas import BriefingResponse, CardResponse
from app.services.briefing_engine import generate_briefing

router = APIRouter(prefix="/briefings", tags=["briefings"])


async def _load_briefing(db, briefing_row, user_id: str) -> BriefingResponse:
    briefing_id = briefing_row["id"]

    cursor = await db.execute(
        "SELECT id, category_name, title, summary, source_url, source_name, position FROM cards WHERE briefing_id = ? ORDER BY position",
        (briefing_id,),
    )
    card_rows = await cursor.fetchall()

    cards = []
    for card_row in card_rows:
        fb_cursor = await db.execute(
            "SELECT action FROM feedback WHERE user_id = ? AND card_id = ?",
            (user_id, card_row["id"]),
        )
        fb_row = await fb_cursor.fetchone()
        feedback = fb_row["action"] if fb_row else None

        cards.append(
            CardResponse(
                id=card_row["id"],
                category_name=card_row["category_name"],
                title=card_row["title"],
                summary=card_row["summary"],
                source_url=card_row["source_url"],
                source_name=card_row["source_name"],
                position=card_row["position"],
                feedback=feedback,
            )
        )

    return BriefingResponse(
        id=briefing_id,
        date=briefing_row["date"],
        cards=cards,
        generated_at=briefing_row["generated_at"],
    )


@router.get("/today", response_model=BriefingResponse)
async def get_today_briefing(user_id: str = Depends(get_current_user)):
    today = date.today().isoformat()

    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id, date, generated_at FROM briefings WHERE user_id = ? AND date = ?",
            (user_id, today),
        )
        row = await cursor.fetchone()

        if row:
            return await _load_briefing(db, row, user_id)

    async with get_db() as db:
        briefing_data = await generate_briefing(db, user_id)

    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id, date, generated_at FROM briefings WHERE user_id = ? AND date = ?",
            (user_id, today),
        )
        row = await cursor.fetchone()
        if row:
            return await _load_briefing(db, row, user_id)

    return BriefingResponse(
        id="",
        date=today,
        cards=[],
        generated_at=datetime.utcnow(),
    )


@router.get("/{briefing_date}", response_model=BriefingResponse)
async def get_briefing_by_date(
    briefing_date: str, user_id: str = Depends(get_current_user)
):
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id, date, generated_at FROM briefings WHERE user_id = ? AND date = ?",
            (user_id, briefing_date),
        )
        row = await cursor.fetchone()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No briefing found for this date",
            )

        return await _load_briefing(db, row, user_id)


@router.post("/generate", response_model=BriefingResponse)
async def force_generate_briefing(user_id: str = Depends(get_current_user)):
    today = date.today().isoformat()

    async with get_db() as db:
        await db.execute(
            "DELETE FROM briefings WHERE user_id = ? AND date = ?",
            (user_id, today),
        )
        await db.commit()

    async with get_db() as db:
        await generate_briefing(db, user_id)

    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id, date, generated_at FROM briefings WHERE user_id = ? AND date = ?",
            (user_id, today),
        )
        row = await cursor.fetchone()
        if row:
            return await _load_briefing(db, row, user_id)

    return BriefingResponse(
        id="",
        date=today,
        cards=[],
        generated_at=datetime.utcnow(),
    )
