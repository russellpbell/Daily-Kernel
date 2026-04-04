import httpx

from app.config import settings


async def search_category(category_name: str, max_results: int = 5) -> list[dict]:
    """Search for recent news articles in a given category.

    Returns a list of dicts with keys: title, url, snippet, source_name.
    Uses Brave Search API if configured, otherwise falls back to a simple
    web search via DuckDuckGo HTML.
    """
    if settings.BRAVE_SEARCH_API_KEY:
        return await _brave_search(category_name, max_results)
    return await _duckduckgo_fallback(category_name, max_results)


async def _brave_search(category_name: str, max_results: int) -> list[dict]:
    query = f"{category_name} news last 24 hours"
    url = "https://api.search.brave.com/res/v1/web/search"
    headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": settings.BRAVE_SEARCH_API_KEY,
    }
    params = {
        "q": query,
        "count": max_results,
        "freshness": "pd",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()

    results = []
    web_results = data.get("web", {}).get("results", [])
    for item in web_results[:max_results]:
        source_name = ""
        display_url = item.get("url", "")
        if display_url:
            from urllib.parse import urlparse

            parsed = urlparse(display_url)
            source_name = parsed.netloc.replace("www.", "")

        results.append(
            {
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "snippet": item.get("description", ""),
                "source_name": source_name,
            }
        )

    return results


async def _duckduckgo_fallback(category_name: str, max_results: int) -> list[dict]:
    """Fallback search using DuckDuckGo Lite HTML parsing."""
    query = f"{category_name} news last 24 hours"
    url = "https://lite.duckduckgo.com/lite/"
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; DailyKernel/1.0)",
    }

    results = []
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.post(url, data={"q": query}, headers=headers)
            response.raise_for_status()
            html = response.text

        import re

        link_pattern = re.compile(
            r'<a[^>]+rel="nofollow"[^>]+href="([^"]+)"[^>]*>\s*(.+?)\s*</a>',
            re.DOTALL,
        )
        snippet_pattern = re.compile(
            r'<td[^>]*class="result-snippet"[^>]*>\s*(.+?)\s*</td>',
            re.DOTALL,
        )

        links = link_pattern.findall(html)
        snippets = snippet_pattern.findall(html)

        for i, (link_url, title) in enumerate(links[:max_results]):
            if link_url.startswith("/") or "duckduckgo" in link_url:
                continue

            title_clean = re.sub(r"<[^>]+>", "", title).strip()
            snippet = ""
            if i < len(snippets):
                snippet = re.sub(r"<[^>]+>", "", snippets[i]).strip()

            from urllib.parse import urlparse

            parsed = urlparse(link_url)
            source_name = parsed.netloc.replace("www.", "")

            results.append(
                {
                    "title": title_clean,
                    "url": link_url,
                    "snippet": snippet,
                    "source_name": source_name,
                }
            )

            if len(results) >= max_results:
                break

    except Exception:
        pass

    return results
