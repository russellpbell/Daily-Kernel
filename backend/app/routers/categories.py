from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=list[CategoryResponse])
async def list_categories(user_id: str = Depends(get_current_user)):
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id, name, weight, is_active FROM categories WHERE user_id = ? ORDER BY name",
            (user_id,),
        )
        rows = await cursor.fetchall()

    return [
        CategoryResponse(
            id=row["id"],
            name=row["name"],
            weight=row["weight"],
            is_active=bool(row["is_active"]),
        )
        for row in rows
    ]


@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    req: CategoryCreate, user_id: str = Depends(get_current_user)
):
    cat_id = str(uuid4())
    now = datetime.utcnow().isoformat()

    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id FROM categories WHERE user_id = ? AND name = ?",
            (user_id, req.name),
        )
        if await cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Category with this name already exists",
            )

        await db.execute(
            "INSERT INTO categories (id, user_id, name, weight, is_active, created_at) VALUES (?, ?, ?, ?, 1, ?)",
            (cat_id, user_id, req.name, req.weight, now),
        )
        await db.commit()

    return CategoryResponse(id=cat_id, name=req.name, weight=req.weight, is_active=True)


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    req: CategoryUpdate,
    user_id: str = Depends(get_current_user),
):
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id, name, weight, is_active FROM categories WHERE id = ? AND user_id = ?",
            (category_id, user_id),
        )
        row = await cursor.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
            )

        name = req.name if req.name is not None else row["name"]
        weight = req.weight if req.weight is not None else row["weight"]
        is_active = req.is_active if req.is_active is not None else bool(row["is_active"])

        await db.execute(
            "UPDATE categories SET name = ?, weight = ?, is_active = ? WHERE id = ?",
            (name, weight, int(is_active), category_id),
        )
        await db.commit()

    return CategoryResponse(id=category_id, name=name, weight=weight, is_active=is_active)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str, user_id: str = Depends(get_current_user)
):
    async with get_db() as db:
        cursor = await db.execute(
            "SELECT id FROM categories WHERE id = ? AND user_id = ?",
            (category_id, user_id),
        )
        if not await cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Category not found"
            )

        await db.execute("DELETE FROM categories WHERE id = ?", (category_id,))
        await db.commit()
