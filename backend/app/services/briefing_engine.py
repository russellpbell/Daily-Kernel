import math
from datetime import date, datetime
from uuid import uuid4

from app.services.news_search import search_category
from app.services.claude_service import summarize_articles


async def generate_briefing(db, user_id: str) -> dict:
    """Generate a daily briefing for a user.

    Steps:
    1. Load user settings and active categories with weights.
    2. Allocate card slots proportionally by weight.
    3. Search news for each category.
    4. Summarize articles with Claude.
    5. Store the briefing and cards in the database.

    Returns a dict with briefing metadata.
    """
    cursor = await db.execute(
        "SELECT cards_per_briefing FROM users WHERE id = ?", (user_id,)
    )
    user_row = await cursor.fetchone()
    if not user_row:
        return {"error": "User not found"}

    total_cards = user_row["cards_per_briefing"]

    cursor = await db.execute(
        "SELECT id, name, weight FROM categories WHERE user_id = ? AND is_active = 1 ORDER BY weight DESC",
        (user_id,),
    )
    category_rows = await cursor.fetchall()

    if not category_rows:
        today = date.today().isoformat()
        briefing_id = str(uuid4())
        now = datetime.utcnow().isoformat()
        await db.execute(
            "INSERT INTO briefings (id, user_id, date, generated_at) VALUES (?, ?, ?, ?)",
            (briefing_id, user_id, today, now),
        )
        await db.commit()
        return {
            "id": briefing_id,
            "date": today,
            "generated_at": now,
            "cards": [],
            "message": "No active categories. Add categories to get your daily briefing.",
        }

    total_weight = sum(row["weight"] for row in category_rows)
    allocations = []

    if total_weight == 0:
        per_cat = max(1, total_cards // len(category_rows))
        allocations = [
            {"name": row["name"], "count": per_cat} for row in category_rows
        ]
    else:
        remaining = total_cards
        for i, row in enumerate(category_rows):
            if i == len(category_rows) - 1:
                count = remaining
            else:
                count = max(1, math.floor((row["weight"] / total_weight) * total_cards))
                remaining -= count
            allocations.append({"name": row["name"], "count": max(1, count)})

    all_cards = []
    position = 0

    for alloc in allocations:
        cat_name = alloc["name"]
        target_count = alloc["count"]

        try:
            articles = await search_category(cat_name, max_results=target_count + 2)
        except Exception:
            articles = []

        if not articles:
            continue

        try:
            summaries = await summarize_articles(cat_name, articles[:target_count])
        except Exception:
            summaries = [
                {
                    "title": a["title"],
                    "summary": a.get("snippet", "Summary unavailable."),
                    "source_url": a.get("url", ""),
                    "source_name": a.get("source_name", ""),
                }
                for a in articles[:target_count]
            ]

        for summary in summaries[:target_count]:
            all_cards.append(
                {
                    "category_name": cat_name,
                    "title": summary.get("title", ""),
                    "summary": summary.get("summary", ""),
                    "source_url": summary.get("source_url", ""),
                    "source_name": summary.get("source_name", ""),
                    "position": position,
                }
            )
            position += 1

    today = date.today().isoformat()
    briefing_id = str(uuid4())
    now = datetime.utcnow().isoformat()

    await db.execute(
        "DELETE FROM briefings WHERE user_id = ? AND date = ?",
        (user_id, today),
    )

    await db.execute(
        "INSERT INTO briefings (id, user_id, date, generated_at) VALUES (?, ?, ?, ?)",
        (briefing_id, user_id, today, now),
    )

    for card_data in all_cards:
        card_id = str(uuid4())
        await db.execute(
            "INSERT INTO cards (id, briefing_id, category_name, title, summary, source_url, source_name, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                card_id,
                briefing_id,
                card_data["category_name"],
                card_data["title"],
                card_data["summary"],
                card_data["source_url"],
                card_data["source_name"],
                card_data["position"],
                now,
            ),
        )

    await db.commit()

    return {
        "id": briefing_id,
        "date": today,
        "generated_at": now,
        "cards_count": len(all_cards),
    }
