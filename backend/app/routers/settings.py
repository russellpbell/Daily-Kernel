from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas import SettingsResponse, SettingsUpdate

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/", response_model=SettingsResponse)
async def get_settings(user_id: str = Depends(get_current_user)):
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT cards_per_briefing FROM users WHERE id = ?", (user_id,)
        )
        row = await cursor.fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return SettingsResponse(cards_per_briefing=row["cards_per_briefing"])


@router.patch("/", response_model=SettingsResponse)
async def update_settings(
    req: SettingsUpdate, user_id: str = Depends(get_current_user)
):
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT cards_per_briefing FROM users WHERE id = ?", (user_id,)
        )
        row = await cursor.fetchone()

        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )

        cards_per_briefing = (
            req.cards_per_briefing
            if req.cards_per_briefing is not None
            else row["cards_per_briefing"]
        )

        if cards_per_briefing < 1 or cards_per_briefing > 50:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="cards_per_briefing must be between 1 and 50",
            )

        await db.execute(
            "UPDATE users SET cards_per_briefing = ? WHERE id = ?",
            (cards_per_briefing, user_id),
        )
        await db.commit()

    return SettingsResponse(cards_per_briefing=cards_per_briefing)
