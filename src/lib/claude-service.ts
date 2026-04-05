import Anthropic from '@anthropic-ai/sdk';
import { NewsArticle, CardSummary } from '@/types';

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

/**
 * Sanitize user-provided text before interpolating into LLM prompts.
 * Truncates to maxLength, strips control characters and newlines,
 * and escapes instruction-like patterns.
 */
export function sanitizeForPrompt(text: string, maxLength: number): string {
  let sanitized = text.slice(0, maxLength);
  // Strip control characters (keep space)
  sanitized = sanitized.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '');
  // Replace newlines with spaces
  sanitized = sanitized.replace(/[\r\n]+/g, ' ');
  // Escape instruction-like patterns (e.g., "SYSTEM:", "ASSISTANT:", "Human:", etc.)
  sanitized = sanitized.replace(/(system|assistant|human|user|instruction|ignore previous|forget|disregard)\s*:/gi, (match) =>
    match.replace(/:/g, '\uFF1A')
  );
  return sanitized.trim();
}

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
  articles: NewsArticle[],
  expertiseLevel: number = 1
): Promise<CardSummary[]> {
  if (articles.length === 0) {
    return [];
  }

  const client = getClient();

  const safeCategoryName = sanitizeForPrompt(categoryName, 200);

  const articlesText = articles
    .map(
      (a, i) =>
        `Article ${i + 1}:\nTitle: ${sanitizeForPrompt(a.title, 500)}\nSource: ${sanitizeForPrompt(a.source_name || '', 200)}\nURL: ${a.url}\nSnippet: ${sanitizeForPrompt(a.snippet || '', 500)}`
    )
    .join('\n\n');

  const levelDescriptions: Record<number, string> = {
    1: 'The reader is a beginner. Use accessible language, explain jargon, and focus on "why this matters" context. Think of explaining to a curious friend.',
    2: 'The reader is getting familiar with this field. You can use some domain terminology but still explain specialized concepts. Connect new developments to foundational concepts.',
    3: 'The reader has intermediate knowledge. Use domain-specific terminology freely. Focus on the methodology, significance, and implications rather than basic context.',
    4: 'The reader is advanced. Be technically precise. Highlight novel methodologies, unexpected findings, and connections to related work. Skip basic explanations.',
    5: 'The reader is an expert. Be maximally technical and concise. Focus on what is genuinely novel, methodological innovations, and potential impact on the field. Reference related frameworks by name.',
  };

  const expertiseContext = levelDescriptions[expertiseLevel] || levelDescriptions[1];

  const systemPrompt = `You are a knowledge curator for Daily Kernel, an app that helps people become experts in their fields through daily bite-sized learning.

${expertiseContext}

Your job is to create concise, engaging card summaries that help the reader build expertise over time. Each card should:
- Give a clear understanding of the key development in 2-3 sentences
- Connect it to broader trends or prior knowledge when relevant
- Highlight one specific insight or takeaway the reader should remember

Be factual and precise. If multiple articles cover the same story, consolidate into one card. For academic papers, emphasize the key finding and why it matters.`;

  const userPrompt = `Category: ${safeCategoryName}

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
 * Generate a fresh take on a previously-reviewed paper.
 * Each review highlights a different aspect: methodology, implications,
 * practical applications, connections to other work, limitations, etc.
 */
export async function generateReviewCard(
  title: string,
  originalSummary: string,
  categoryName: string,
  timesReviewed: number,
  expertiseLevel: number = 1
): Promise<CardSummary> {
  const client = getClient();

  const angles = [
    'Focus on the practical applications and real-world implications of this research.',
    'Highlight the methodology and what makes this approach novel or interesting.',
    'Explore how this work connects to broader trends in the field.',
    'Discuss the limitations and open questions this research raises.',
    'Extract one concrete takeaway or mental model the reader should remember.',
    'Compare this approach to alternative methods and explain the tradeoffs.',
    'Explain why this research matters for the future of the field.',
  ];

  const angle = angles[timesReviewed % angles.length];

  const levelDescriptions: Record<number, string> = {
    1: 'Use accessible language and explain jargon.',
    2: 'Use some domain terminology but explain specialized concepts.',
    3: 'Use domain-specific terminology freely.',
    4: 'Be technically precise and skip basic explanations.',
    5: 'Be maximally technical and concise.',
  };

  const levelContext = levelDescriptions[expertiseLevel] || levelDescriptions[1];

  const systemPrompt = `You are a knowledge curator helping someone build deep expertise through spaced repetition. ${levelContext}`;

  const safeTitle = sanitizeForPrompt(title, 500);
  const safeCatName = sanitizeForPrompt(categoryName, 200);
  const safeSummary = sanitizeForPrompt(originalSummary, 500);

  const userPrompt = `This is a paper/article the reader has seen before and wants to deepen their understanding of:

Title: ${safeTitle}
Category: ${safeCatName}
Previous summary: ${safeSummary}

This is review #${timesReviewed + 1}. ${angle}

Write a fresh 2-3 sentence summary that highlights this NEW angle. Don't repeat the original summary - give them something new to think about.

Respond as JSON: {"title": "...", "summary": "..."}`;

  try {
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    let jsonStr = text.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    const parsed = JSON.parse(jsonStr);
    return {
      title: String(parsed.title || title),
      summary: String(parsed.summary || originalSummary),
      source_url: null,
      source_name: null,
    };
  } catch {
    return {
      title: `Review: ${title}`,
      summary: originalSummary,
      source_url: null,
      source_name: null,
    };
  }
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
