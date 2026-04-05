import { NewsArticle } from '@/types';

const BRAVE_API_KEY = process.env.BRAVE_SEARCH_API_KEY || '';
const BRAVE_SEARCH_URL = 'https://api.search.brave.com/res/v1/web/search';
const DUCKDUCKGO_LITE_URL = 'https://lite.duckduckgo.com/lite/';

/**
 * Search for recent news articles in a given category.
 * Uses Brave Search API if a key is available, otherwise falls back to DuckDuckGo lite.
 */
export async function searchCategory(
  categoryName: string,
  maxResults: number = 5
): Promise<NewsArticle[]> {
  if (BRAVE_API_KEY) {
    return searchBrave(categoryName, maxResults);
  }
  return searchDuckDuckGo(categoryName, maxResults);
}

/**
 * Search using the Brave Search API with freshness set to last 24 hours.
 */
async function searchBrave(
  query: string,
  maxResults: number
): Promise<NewsArticle[]> {
  const params = new URLSearchParams({
    q: `${query} news today`,
    count: String(maxResults),
    freshness: 'pd', // past day
    text_decorations: 'false',
  });

  try {
    const response = await fetch(`${BRAVE_SEARCH_URL}?${params}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': BRAVE_API_KEY,
      },
    });

    if (!response.ok) {
      console.error(`Brave search failed with status ${response.status}`);
      return searchDuckDuckGo(query, maxResults);
    }

    const data = await response.json();
    const webResults = data.web?.results || [];

    return webResults.slice(0, maxResults).map((result: {
      title?: string;
      url?: string;
      description?: string;
      meta_url?: { hostname?: string };
    }) => ({
      title: result.title || 'Untitled',
      url: result.url || '',
      snippet: result.description || '',
      source_name: extractDomain(result.url || result.meta_url?.hostname || ''),
    }));
  } catch (error) {
    console.error('Brave search error:', error);
    return searchDuckDuckGo(query, maxResults);
  }
}

/**
 * Fallback search using DuckDuckGo lite (HTML scraping).
 * This is a best-effort fallback that parses the lite HTML page.
 */
async function searchDuckDuckGo(
  query: string,
  maxResults: number
): Promise<NewsArticle[]> {
  try {
    const formData = new URLSearchParams({
      q: `${query} news today`,
    });

    const response = await fetch(DUCKDUCKGO_LITE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (compatible; DailyKernel/1.0)',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      console.error(`DuckDuckGo search failed with status ${response.status}`);
      return [];
    }

    const html = await response.text();
    return parseDuckDuckGoLite(html, maxResults);
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
    return [];
  }
}

/**
 * Parse DuckDuckGo lite HTML response to extract search results.
 * The lite page has a simple table-based layout with result links and snippets.
 */
function parseDuckDuckGoLite(html: string, maxResults: number): NewsArticle[] {
  const articles: NewsArticle[] = [];

  // DuckDuckGo lite results are in table rows with class "result-link" for links
  // and "result-snippet" for descriptions
  const linkRegex = /<a[^>]+class="result-link"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi;
  const snippetRegex = /<td[^>]+class="result-snippet"[^>]*>([\s\S]*?)<\/td>/gi;

  const links: { url: string; title: string }[] = [];
  let linkMatch;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    links.push({
      url: linkMatch[1],
      title: linkMatch[2].trim(),
    });
  }

  const snippets: string[] = [];
  let snippetMatch;
  while ((snippetMatch = snippetRegex.exec(html)) !== null) {
    // Strip HTML tags from snippet
    const clean = snippetMatch[1].replace(/<[^>]*>/g, '').trim();
    snippets.push(clean);
  }

  // If the regex-based parsing didn't work, try a simpler anchor-based approach
  if (links.length === 0) {
    const simpleLinkRegex = /<a[^>]+rel="nofollow"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let simpleMatch;
    while ((simpleMatch = simpleLinkRegex.exec(html)) !== null) {
      const url = simpleMatch[1];
      const title = simpleMatch[2].replace(/<[^>]*>/g, '').trim();
      // Filter out DuckDuckGo internal links
      if (url.startsWith('http') && !url.includes('duckduckgo.com') && title.length > 0) {
        links.push({ url, title });
      }
    }
  }

  for (let i = 0; i < Math.min(links.length, maxResults); i++) {
    articles.push({
      title: links[i].title || 'Untitled',
      url: links[i].url,
      snippet: snippets[i] || '',
      source_name: extractDomain(links[i].url),
    });
  }

  return articles;
}

/**
 * Extract a readable domain name from a URL.
 */
function extractDomain(urlOrHostname: string): string {
  try {
    const hostname = urlOrHostname.includes('://')
      ? new URL(urlOrHostname).hostname
      : urlOrHostname;
    // Remove www. prefix and return
    return hostname.replace(/^www\./, '');
  } catch {
    return urlOrHostname;
  }
}
