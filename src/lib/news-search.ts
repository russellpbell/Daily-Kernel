import { NewsArticle } from '@/types';

const GOOGLE_CSE_API_KEY = process.env.GOOGLE_CSE_API_KEY || '';
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID || '';
const GOOGLE_CSE_URL = 'https://www.googleapis.com/customsearch/v1';
const DUCKDUCKGO_LITE_URL = 'https://lite.duckduckgo.com/lite/';

/**
 * Search for articles in a given category using the appropriate source.
 * Routes to Google CSE/DuckDuckGo, PubMed, arXiv, or OpenAlex based on sourceType.
 */
export async function searchCategory(
  categoryName: string,
  maxResults: number = 5,
  sourceType: string = 'news'
): Promise<NewsArticle[]> {
  switch (sourceType) {
    case 'biomedical':
      return searchPubMed(categoryName, maxResults);
    case 'stem':
      return searchArXiv(categoryName, maxResults);
    case 'academic':
      return searchOpenAlex(categoryName, maxResults);
    case 'news':
    default:
      if (GOOGLE_CSE_API_KEY && GOOGLE_CSE_ID) {
        return searchGoogle(categoryName, maxResults);
      }
      return searchDuckDuckGo(categoryName, maxResults);
  }
}

// ---------------------------------------------------------------------------
// Google Custom Search JSON API
// ---------------------------------------------------------------------------

/**
 * Search using the Google Custom Search JSON API with dateRestrict for last 24 hours.
 * Free tier: 100 queries/day. Requires a Programmable Search Engine ID + API key.
 */
async function searchGoogle(
  query: string,
  maxResults: number
): Promise<NewsArticle[]> {
  try {
    // Google CSE returns max 10 results per request
    const num = Math.min(maxResults, 10);
    const params = new URLSearchParams({
      key: GOOGLE_CSE_API_KEY,
      cx: GOOGLE_CSE_ID,
      q: `${query} news`,
      num: String(num),
      dateRestrict: 'd1', // last 24 hours
      sort: 'date',
    });

    const response = await fetch(`${GOOGLE_CSE_URL}?${params}`);

    if (!response.ok) {
      console.error(`Google CSE failed with status ${response.status}`);
      return searchDuckDuckGo(query, maxResults);
    }

    const data = await response.json();
    const items: Array<{
      title?: string;
      link?: string;
      snippet?: string;
      displayLink?: string;
    }> = data.items || [];

    return items.slice(0, maxResults).map((item) => ({
      title: item.title || 'Untitled',
      url: item.link || '',
      snippet: item.snippet || '',
      source_name: item.displayLink || extractDomain(item.link || ''),
    }));
  } catch (error) {
    console.error('Google CSE error:', error);
    return searchDuckDuckGo(query, maxResults);
  }
}

// ---------------------------------------------------------------------------
// DuckDuckGo fallback (existing)
// ---------------------------------------------------------------------------

/**
 * Fallback search using DuckDuckGo lite (HTML scraping).
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
 */
function parseDuckDuckGoLite(html: string, maxResults: number): NewsArticle[] {
  const articles: NewsArticle[] = [];

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
    const clean = snippetMatch[1].replace(/<[^>]*>/g, '').trim();
    snippets.push(clean);
  }

  if (links.length === 0) {
    const simpleLinkRegex = /<a[^>]+rel="nofollow"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    let simpleMatch;
    while ((simpleMatch = simpleLinkRegex.exec(html)) !== null) {
      const url = simpleMatch[1];
      const title = simpleMatch[2].replace(/<[^>]*>/g, '').trim();
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

// ---------------------------------------------------------------------------
// PubMed E-utilities
// ---------------------------------------------------------------------------

/**
 * Search PubMed for recent biomedical articles using the E-utilities API.
 * Two-step process: esearch to get IDs, then esummary to get details.
 */
async function searchPubMed(
  query: string,
  maxResults: number
): Promise<NewsArticle[]> {
  try {
    // Step 1: Search for article IDs
    const searchParams = new URLSearchParams({
      db: 'pubmed',
      term: query,
      retmax: String(maxResults),
      sort: 'date',
      datetype: 'edat',
      reldate: '1',
      retmode: 'json',
    });

    const searchResponse = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?${searchParams}`
    );

    if (!searchResponse.ok) {
      console.error(`PubMed esearch failed with status ${searchResponse.status}`);
      return [];
    }

    const searchData = await searchResponse.json();
    const idList: string[] = searchData.esearchresult?.idlist || [];

    if (idList.length === 0) {
      return [];
    }

    // Step 2: Get summaries for found IDs
    const summaryParams = new URLSearchParams({
      db: 'pubmed',
      id: idList.join(','),
      retmode: 'json',
    });

    const summaryResponse = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?${summaryParams}`
    );

    if (!summaryResponse.ok) {
      console.error(`PubMed esummary failed with status ${summaryResponse.status}`);
      return [];
    }

    const summaryData = await summaryResponse.json();
    const results = summaryData.result || {};
    const uids: string[] = results.uids || idList;

    return uids.slice(0, maxResults).map((pmid: string) => {
      const article = results[pmid] || {};
      const authors = (article.authors || [])
        .slice(0, 3)
        .map((a: { name?: string }) => a.name || '')
        .filter(Boolean)
        .join(', ');
      const journal = article.source || article.fulljournalname || '';
      const snippetParts = [authors, journal].filter(Boolean);

      return {
        title: article.title || 'Untitled',
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        snippet: snippetParts.join(' - ') || 'PubMed article',
        source_name: journal || 'PubMed',
      };
    });
  } catch (error) {
    console.error('PubMed search error:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// arXiv API
// ---------------------------------------------------------------------------

/**
 * Search arXiv for recent STEM preprints.
 * Returns Atom XML parsed with regex (edge-runtime compatible).
 */
async function searchArXiv(
  query: string,
  maxResults: number
): Promise<NewsArticle[]> {
  try {
    const params = new URLSearchParams({
      search_query: `all:${query}`,
      start: '0',
      max_results: String(maxResults + 5), // fetch extra to allow filtering
      sortBy: 'submittedDate',
      sortOrder: 'descending',
    });

    const response = await fetch(
      `https://export.arxiv.org/api/query?${params}`
    );

    if (!response.ok) {
      console.error(`arXiv search failed with status ${response.status}`);
      return [];
    }

    const xml = await response.text();

    // Parse entries from Atom XML using regex
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    const articles: NewsArticle[] = [];
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    let entryMatch;
    while ((entryMatch = entryRegex.exec(xml)) !== null && articles.length < maxResults) {
      const entry = entryMatch[1];

      // Check published date - filter to last 24 hours
      const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
      if (publishedMatch) {
        const publishedDate = new Date(publishedMatch[1]).getTime();
        if (now - publishedDate > oneDayMs) {
          continue;
        }
      }

      const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
      const idMatch = entry.match(/<id>([\s\S]*?)<\/id>/);
      const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);

      const title = (titleMatch?.[1] || 'Untitled').replace(/\s+/g, ' ').trim();
      const url = (idMatch?.[1] || '').trim();
      let snippet = (summaryMatch?.[1] || '').replace(/\s+/g, ' ').trim();
      if (snippet.length > 300) {
        snippet = snippet.substring(0, 297) + '...';
      }

      articles.push({
        title,
        url,
        snippet,
        source_name: 'arXiv',
      });
    }

    // If date filtering removed everything, return unfiltered results (up to maxResults)
    if (articles.length === 0) {
      entryRegex.lastIndex = 0;
      while ((entryMatch = entryRegex.exec(xml)) !== null && articles.length < maxResults) {
        const entry = entryMatch[1];
        const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
        const idMatch = entry.match(/<id>([\s\S]*?)<\/id>/);
        const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);

        const title = (titleMatch?.[1] || 'Untitled').replace(/\s+/g, ' ').trim();
        const url = (idMatch?.[1] || '').trim();
        let snippet = (summaryMatch?.[1] || '').replace(/\s+/g, ' ').trim();
        if (snippet.length > 300) {
          snippet = snippet.substring(0, 297) + '...';
        }

        articles.push({
          title,
          url,
          snippet,
          source_name: 'arXiv',
        });
      }
    }

    return articles;
  } catch (error) {
    console.error('arXiv search error:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// OpenAlex API
// ---------------------------------------------------------------------------

/**
 * Reconstruct abstract text from OpenAlex inverted index format.
 * The inverted index maps words to arrays of position indices.
 */
function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
  if (!invertedIndex || typeof invertedIndex !== 'object') {
    return '';
  }

  const words: [number, string][] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    if (!Array.isArray(positions)) continue;
    for (const pos of positions) {
      words.push([pos, word]);
    }
  }

  words.sort((a, b) => a[0] - b[0]);
  return words.map(([, word]) => word).join(' ');
}

/**
 * Search OpenAlex for recent academic works.
 */
async function searchOpenAlex(
  query: string,
  maxResults: number
): Promise<NewsArticle[]> {
  try {
    // Calculate yesterday's date for the filter
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const params = new URLSearchParams({
      search: query,
      filter: `from_publication_date:${yesterdayStr}`,
      sort: 'publication_date:desc',
      per_page: String(maxResults),
      mailto: 'dailykernel@app.local',
    });

    const response = await fetch(
      `https://api.openalex.org/works?${params}`
    );

    if (!response.ok) {
      console.error(`OpenAlex search failed with status ${response.status}`);
      return [];
    }

    const data = await response.json();
    const results: Array<{
      display_name?: string;
      doi?: string;
      id?: string;
      abstract_inverted_index?: Record<string, number[]>;
      concepts?: Array<{ display_name?: string }>;
      primary_location?: {
        source?: {
          display_name?: string;
        };
      };
    }> = data.results || [];

    return results.slice(0, maxResults).map((work) => {
      const title = work.display_name || 'Untitled';
      const url = work.doi || work.id || '';
      const sourceName =
        work.primary_location?.source?.display_name || 'OpenAlex';

      // Try to reconstruct abstract; fall back to concept names
      let snippet = '';
      if (work.abstract_inverted_index) {
        snippet = reconstructAbstract(work.abstract_inverted_index);
        if (snippet.length > 300) {
          snippet = snippet.substring(0, 297) + '...';
        }
      }
      if (!snippet && work.concepts && work.concepts.length > 0) {
        snippet = work.concepts
          .slice(0, 5)
          .map((c) => c.display_name)
          .filter(Boolean)
          .join(', ');
      }
      if (!snippet) {
        snippet = 'Academic publication';
      }

      return {
        title,
        url,
        snippet,
        source_name: sourceName,
      };
    });
  } catch (error) {
    console.error('OpenAlex search error:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Extract a readable domain name from a URL.
 */
function extractDomain(urlOrHostname: string): string {
  try {
    const hostname = urlOrHostname.includes('://')
      ? new URL(urlOrHostname).hostname
      : urlOrHostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return urlOrHostname;
  }
}
