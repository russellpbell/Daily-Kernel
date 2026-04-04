async def get_category_scores(db, user_id: str) -> dict:
    """Compute a relevance score for each category based on user feedback.

    Returns a dict mapping category name to a score in [-1.0, 1.0].
    Formula: (thumbs_up - thumbs_down) / total_feedback for each category.
    """
    cursor = await db.execute(
        """
        SELECT c.category_name,
               SUM(CASE WHEN f.action = 'thumbs_up' THEN 1 ELSE 0 END) as ups,
               SUM(CASE WHEN f.action = 'thumbs_down' THEN 1 ELSE 0 END) as downs,
               COUNT(*) as total
        FROM feedback f
        JOIN cards c ON f.card_id = c.id
        JOIN briefings b ON c.briefing_id = b.id
        WHERE f.user_id = ? AND b.user_id = ?
        GROUP BY c.category_name
        """,
        (user_id, user_id),
    )
    rows = await cursor.fetchall()

    scores = {}
    for row in rows:
        total = row["total"]
        if total > 0:
            scores[row["category_name"]] = (row["ups"] - row["downs"]) / total
        else:
            scores[row["category_name"]] = 0.0

    return scores


async def get_weight_suggestions(db, user_id: str) -> list[dict]:
    """Generate weight adjustment suggestions based on feedback patterns.

    Returns a list of dicts with: category_name, current_weight, suggested_weight, reason.
    """
    scores = await get_category_scores(db, user_id)

    if not scores:
        return []

    cursor = await db.execute(
        "SELECT name, weight FROM categories WHERE user_id = ? AND is_active = 1",
        (user_id,),
    )
    category_rows = await cursor.fetchall()

    suggestions = []
    for row in category_rows:
        cat_name = row["name"]
        current_weight = row["weight"]
        score = scores.get(cat_name, 0.0)

        if score > 0.3 and current_weight < 3.0:
            suggested = min(3.0, current_weight + 0.5)
            suggestions.append(
                {
                    "category_name": cat_name,
                    "current_weight": current_weight,
                    "suggested_weight": round(suggested, 1),
                    "reason": f"You frequently like {cat_name} articles (score: {score:.2f}). Consider increasing its weight.",
                }
            )
        elif score < -0.3 and current_weight > 0.5:
            suggested = max(0.5, current_weight - 0.5)
            suggestions.append(
                {
                    "category_name": cat_name,
                    "current_weight": current_weight,
                    "suggested_weight": round(suggested, 1),
                    "reason": f"You often dislike {cat_name} articles (score: {score:.2f}). Consider reducing its weight.",
                }
            )

    return suggestions
