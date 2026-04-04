import json

import anthropic

from app.config import settings

SUMMARIZE_SYSTEM_PROMPT = (
    "You are a news curator for a daily briefing app called Daily Kernel. "
    "Summarize each article into a compelling 2-3 sentence summary. "
    "Focus on why this matters and what's new. Be concise and engaging."
)


async def summarize_articles(
    category_name: str, articles: list[dict]
) -> list[dict]:
    """Summarize a list of articles using Claude.

    Each article dict should have: title, url, snippet, source_name.
    Returns a list of dicts with: title, summary, source_url, source_name.
    """
    if not articles:
        return []

    articles_text = ""
    for i, article in enumerate(articles, 1):
        articles_text += (
            f"Article {i}:\n"
            f"Title: {article['title']}\n"
            f"Source: {article.get('source_name', 'Unknown')}\n"
            f"Snippet: {article.get('snippet', 'No preview available')}\n\n"
        )

    user_prompt = (
        f"Category: {category_name}\n\n"
        f"{articles_text}"
        f"For each article, provide a JSON array of objects with these fields:\n"
        f'- "title": the article title (keep original or improve slightly)\n'
        f'- "summary": a 2-3 sentence summary\n'
        f'- "article_index": the 1-based index of the article\n\n'
        f"Respond ONLY with the JSON array, no other text."
    )

    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    try:
        message = await client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=2048,
            system=SUMMARIZE_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )

        response_text = message.content[0].text.strip()

        if response_text.startswith("```"):
            lines = response_text.split("\n")
            lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            response_text = "\n".join(lines)

        summaries_raw = json.loads(response_text)

        results = []
        for item in summaries_raw:
            idx = item.get("article_index", 0) - 1
            source_article = articles[idx] if 0 <= idx < len(articles) else {}

            results.append(
                {
                    "title": item.get("title", source_article.get("title", "")),
                    "summary": item.get("summary", ""),
                    "source_url": source_article.get("url", ""),
                    "source_name": source_article.get("source_name", ""),
                }
            )

        return results

    except (json.JSONDecodeError, KeyError, IndexError):
        return [
            {
                "title": article["title"],
                "summary": article.get("snippet", "Summary unavailable."),
                "source_url": article.get("url", ""),
                "source_name": article.get("source_name", ""),
            }
            for article in articles
        ]
    except anthropic.APIError:
        return [
            {
                "title": article["title"],
                "summary": article.get("snippet", "Summary unavailable."),
                "source_url": article.get("url", ""),
                "source_name": article.get("source_name", ""),
            }
            for article in articles
        ]


async def analyze_feedback(feedback_data: list[dict]) -> str:
    """Analyze user feedback patterns and return insights.

    feedback_data: list of dicts with keys: category_name, action, count.
    Returns a string with insights about user preferences.
    """
    if not feedback_data:
        return "No feedback data available yet."

    feedback_text = "User feedback summary:\n"
    for item in feedback_data:
        feedback_text += (
            f"- {item['category_name']}: "
            f"{item.get('thumbs_up', 0)} thumbs up, "
            f"{item.get('thumbs_down', 0)} thumbs down, "
            f"{item.get('skips', 0)} skips\n"
        )

    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    try:
        message = await client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=512,
            system=(
                "You are an analytics assistant for Daily Kernel, a news briefing app. "
                "Analyze the user's feedback patterns and provide brief, actionable insights "
                "about their content preferences. Be concise - 2-3 sentences max."
            ),
            messages=[
                {
                    "role": "user",
                    "content": f"Analyze this feedback data and suggest how to improve the briefing:\n\n{feedback_text}",
                }
            ],
        )
        return message.content[0].text.strip()
    except anthropic.APIError:
        return "Unable to analyze feedback at this time."
