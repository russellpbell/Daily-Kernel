import { SupabaseClient } from '@supabase/supabase-js';

// Fibonacci-ish intervals: 1, 2, 4, 7, 14, 30, 60 days
const REVIEW_INTERVALS = [1, 2, 4, 7, 14, 30, 60];

/**
 * Add a paper to the review queue when user marks it as "Learned".
 * Only for non-news source types (academic papers benefit from repetition).
 */
export async function addToReviewQueue(
  supabase: SupabaseClient,
  userId: string,
  card: {
    source_url: string | null;
    title: string;
    summary: string;
    category_name: string;
    source_name: string | null;
  },
  sourceType: string
): Promise<void> {
  // Only queue academic/research content for spaced repetition, not news
  if (sourceType === 'news' || !card.source_url) return;

  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  await supabase.from('review_queue').upsert(
    {
      user_id: userId,
      source_url: card.source_url,
      title: card.title,
      original_summary: card.summary,
      category_name: card.category_name,
      source_name: card.source_name,
      next_review_date: tomorrow,
      interval_days: 1,
    },
    { onConflict: 'user_id,source_url', ignoreDuplicates: true }
  );
}

/**
 * Get papers due for review today.
 * Returns items from the review queue where next_review_date <= today.
 */
export async function getDueReviews(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 5
): Promise<Array<{
  id: string;
  source_url: string;
  title: string;
  original_summary: string;
  category_name: string;
  source_name: string | null;
  times_reviewed: number;
}>> {
  const today = new Date().toISOString().split('T')[0];

  const { data } = await supabase
    .from('review_queue')
    .select('id, source_url, title, original_summary, category_name, source_name, times_reviewed')
    .eq('user_id', userId)
    .lte('next_review_date', today)
    .order('next_review_date', { ascending: true })
    .limit(limit);

  return data || [];
}

/**
 * Mark a review item as reviewed. Advances the interval using spaced repetition schedule.
 */
export async function markReviewed(
  supabase: SupabaseClient,
  reviewId: string
): Promise<void> {
  const { data: item } = await supabase
    .from('review_queue')
    .select('times_reviewed, interval_days')
    .eq('id', reviewId)
    .single();

  if (!item) return;

  const newTimesReviewed = item.times_reviewed + 1;
  const intervalIndex = Math.min(newTimesReviewed, REVIEW_INTERVALS.length - 1);
  const newInterval = REVIEW_INTERVALS[intervalIndex];
  const nextDate = new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  await supabase
    .from('review_queue')
    .update({
      times_reviewed: newTimesReviewed,
      interval_days: newInterval,
      next_review_date: nextDate,
    })
    .eq('id', reviewId);
}

/**
 * Remove an item from the review queue (user is no longer interested).
 */
export async function removeFromReviewQueue(
  supabase: SupabaseClient,
  reviewId: string
): Promise<void> {
  await supabase.from('review_queue').delete().eq('id', reviewId);
}
