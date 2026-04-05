import Anthropic from '@anthropic-ai/sdk';
import { NewsArticle, CardSummary } from '@/types';

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';

function getClient(): Anthropic {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });
}

/**
 * Summarize a batch of news articles for a given category into briefing cards.
 * Returns an array of card summaries with title, summary, source URL, and source name.
 */
export async function summarizeArticles(
  categoryName: string,
  articles: NewsArticle[]
): Promise<CardSummary[]> {
  if (articles.length === 0) {
    return [];
  }

  const client = getClient();

  const articlesText = articles
    .map(
      (a, i) =>
        `Article ${i + 1}:\nTitle: ${a.title}\nSource: ${a.source_name}\nURL: ${a.url}\nSnippet: ${a.snippet}`
    )
    .join('\n\n');

  const systemPrompt = `You are a news curator for a daily briefing app called Daily Kernel. Your job is to create concise, informative card summaries from news articles. Each card should give the reader a quick understanding of the key story in 2-3 sentences. Be factual, neutral, and focus on what matters most. Avoid sensationalism. If multiple articles cover the same story, consolidate them into one card and pick the best source.`;

  const userPrompt = `Category: ${categoryName}

Here are the articles to summarize:

${articlesText}

Create a JSON array of card summaries. Each card should have:
- "title": A clear, concise headline (max 80 chars)
- "summary": A 2-3 sentence summary of the key points
- "source_url": The URL of the primary source article
- "source_name": The name of the source

Respond ONLY with a valid JSON array. No other text.`;

  try {
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    return parseCardSummaries(responseText, articles);
  } catch (error) {
    console.error('Claude summarization error:', error);
    // Fallback: use raw article snippets as summaries
    return fallbackSummaries(articles);
  }
}

/**
 * Parse Claude's JSON response into card summaries, with fallback handling.
 */
function parseCardSummaries(
  responseText: string,
  originalArticles: NewsArticle[]
): CardSummary[] {
  try {
    // Try to extract JSON from the response (handle markdown code blocks)
    let jsonStr = responseText.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    return parsed.map((item: Record<string, unknown>) => ({
      title: String(item.title || 'Untitled'),
      summary: String(item.summary || ''),
      source_url: item.source_url ? String(item.source_url) : null,
      source_name: item.source_name ? String(item.source_name) : null,
    }));
  } catch (parseError) {
    console.error('Failed to parse Claude response:', parseError);
    return fallbackSummaries(originalArticles);
  }
}

/**
 * Fallback: convert raw articles into card summaries when Claude is unavailable.
 */
function fallbackSummaries(articles: NewsArticle[]): CardSummary[] {
  return articles.map((article) => ({
    title: article.title,
    summary: article.snippet || 'No summary available.',
    source_url: article.url || null,
    source_name: article.source_name || null,
  }));
}

/**
 * Analyze user feedback data and generate insights about reading preferences.
 * Returns a human-readable string with insights.
 */
export async function analyzeFeedback(
  feedbackData: {
    category: string;
    thumbs_up: number;
    thumbs_down: number;
    skip: number;
  }[]
): Promise<string> {
  if (feedbackData.length === 0) {
    return 'No feedback data available to analyze.';
  }

  const client = getClient();

  const dataText = feedbackData
    .map(
      (f) =>
        `${f.category}: ${f.thumbs_up} liked, ${f.thumbs_down} disliked, ${f.skip} skipped`
    )
    .join('\n');

  const prompt = `Here is a user's feedback data from a daily news briefing app:

${dataText}

Based on this feedback, provide 2-3 brief, actionable insights about their reading preferences. What categories do they engage with most? What should be adjusted? Keep it concise and friendly.`;

  try {
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      system:
        'You are a helpful assistant that analyzes reading habits and provides brief, actionable insights.',
    });

    return message.content[0].type === 'text'
      ? message.content[0].text
      : 'Unable to generate insights.';
  } catch (error) {
    console.error('Claude feedback analysis error:', error);
    return 'Unable to analyze feedback at this time. Please try again later.';
  }
}
