import { SupabaseClient } from '@supabase/supabase-js';
import { searchCategory } from '@/lib/news-search';
import { summarizeArticles } from '@/lib/claude-service';
import { Briefing, CardSummary } from '@/types';

/**
 * Allocate card counts to categories proportionally based on weights.
 * Ensures at least 1 card per active category and the total matches the target.
 */
function allocateCards(
  categories: { name: string; weight: number; source_type?: string }[],
  totalCards: number
): { name: string; count: number; source_type?: string }[] {
  if (categories.length === 0) return [];

  const totalWeight = categories.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) {
    // Equal distribution if all weights are zero
    const base = Math.floor(totalCards / categories.length);
    let remainder = totalCards - base * categories.length;
    return categories.map((c) => ({
      name: c.name,
      count: base + (remainder-- > 0 ? 1 : 0),
    }));
  }

  // Proportional allocation with minimum of 1
  const raw = categories.map((c) => ({
    name: c.name,
    source_type: c.source_type,
    rawCount: (c.weight / totalWeight) * totalCards,
  }));

  // Floor each and track remainders for rounding
  const allocated = raw.map((r) => ({
    name: r.name,
    source_type: r.source_type,
    count: Math.max(1, Math.floor(r.rawCount)),
    remainder: r.rawCount - Math.floor(r.rawCount),
  }));

  let currentTotal = allocated.reduce((sum, a) => sum + a.count, 0);

  // Distribute remaining cards to categories with highest remainders
  if (currentTotal < totalCards) {
    const sorted = [...allocated].sort((a, b) => b.remainder - a.remainder);
    for (const item of sorted) {
      if (currentTotal >= totalCards) break;
      item.count++;
      currentTotal++;
    }
  }

  // If we over-allocated (due to minimum of 1), trim from lowest-weight categories
  if (currentTotal > totalCards) {
    const sorted = [...allocated].sort((a, b) => a.remainder - b.remainder);
    for (const item of sorted) {
      if (currentTotal <= totalCards) break;
      if (item.count > 1) {
        item.count--;
        currentTotal--;
      }
    }
  }

  return allocated.map((a) => ({ name: a.name, count: a.count, source_type: a.source_type }));
}

/**
 * Generate a daily briefing for a user.
 * Loads categories, searches news, summarizes with Claude, and stores everything in Supabase.
 * Returns the full briefing object with cards.
 */
export async function generateBriefing(
  supabase: SupabaseClient,
  userId: string
): Promise<Briefing> {
  const today = new Date().toISOString().split('T')[0];

  // Check if briefing already exists for today
  const { data: existingBriefing } = await supabase
    .from('briefings')
    .select('id, generated_at')
    .eq('user_id', userId)
    .eq('date', today)
    .single();

  if (existingBriefing) {
    // Return existing briefing with cards
    const { data: existingCards } = await supabase
      .from('cards')
      .select('*')
      .eq('briefing_id', existingBriefing.id)
      .order('position', { ascending: true });

    return {
      id: existingBriefing.id,
      user_id: userId,
      date: today,
      generated_at: existingBriefing.generated_at,
      cards: existingCards || [],
    };
  }

  // Get user settings
  const { data: user } = await supabase
    .from('users')
    .select('cards_per_briefing')
    .eq('id', userId)
    .single();

  const cardsPerBriefing = user?.cards_per_briefing || 10;

  // Get active categories with weights and source type
  const { data: categories } = await supabase
    .from('categories')
    .select('name, weight, source_type')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('weight', { ascending: false });

  const activeCategories =
    categories && categories.length > 0
      ? categories
      : [{ name: 'General News', weight: 1.0, source_type: 'news' as const }];

  // Allocate cards proportionally across categories
  const allocation = allocateCards(activeCategories, cardsPerBriefing);

  // Search news and summarize for each category in parallel
  const categoryResults = await Promise.all(
    allocation.map(async ({ name, count, source_type }) => {
      // Search for more articles than needed to give Claude good material
      const searchResults = await searchCategory(name, Math.min(count * 2, 10), source_type || 'news');

      let summaries: CardSummary[];
      if (searchResults.length > 0) {
        summaries = await summarizeArticles(name, searchResults);
      } else {
        // No search results; return empty for this category
        summaries = [];
      }

      // Take only as many as allocated
      return {
        categoryName: name,
        cards: summaries.slice(0, count),
      };
    })
  );

  // Flatten cards with positions
  const allCards: {
    category_name: string;
    title: string;
    summary: string;
    source_url: string | null;
    source_name: string | null;
    position: number;
  }[] = [];

  let position = 0;
  for (const result of categoryResults) {
    for (const card of result.cards) {
      allCards.push({
        category_name: result.categoryName,
        title: card.title,
        summary: card.summary,
        source_url: card.source_url,
        source_name: card.source_name,
        position: position++,
      });
    }
  }

  // Create briefing record
  const { data: briefing, error: briefingError } = await supabase
    .from('briefings')
    .insert({ user_id: userId, date: today })
    .select('id, generated_at')
    .single();

  if (briefingError || !briefing) {
    throw new Error(`Failed to create briefing: ${briefingError?.message}`);
  }

  // Insert cards
  let insertedCards: Array<{
    id: string;
    briefing_id: string;
    category_name: string;
    title: string;
    summary: string;
    source_url: string | null;
    source_name: string | null;
    position: number;
    created_at: string;
  }> = [];

  if (allCards.length > 0) {
    const cardRows = allCards.map((card) => ({
      briefing_id: briefing.id,
      ...card,
    }));

    const { data: cards } = await supabase
      .from('cards')
      .insert(cardRows)
      .select('*')
      .order('position', { ascending: true });

    insertedCards = cards || [];
  }

  // Initialize daily completion tracking
  await supabase.from('daily_completions').upsert(
    {
      user_id: userId,
      date: today,
      cards_reviewed: 0,
      cards_total: allCards.length,
    },
    { onConflict: 'user_id,date' }
  );

  return {
    id: briefing.id,
    user_id: userId,
    date: today,
    generated_at: briefing.generated_at,
    cards: insertedCards,
  };
}
