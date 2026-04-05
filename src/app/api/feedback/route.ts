import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getUserIdFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();
    const body = await request.json();
    const { card_id, action } = body;

    if (!card_id || !action) {
      return NextResponse.json({ error: 'card_id and action are required' }, { status: 400 });
    }

    if (!['thumbs_up', 'thumbs_down', 'skip'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be thumbs_up, thumbs_down, or skip' }, { status: 400 });
    }

    // Verify card belongs to user's briefing
    const { data: card } = await supabase
      .from('cards')
      .select('id, briefing_id, category_name')
      .eq('id', card_id)
      .single();

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const { data: briefing } = await supabase
      .from('briefings')
      .select('id, user_id, date')
      .eq('id', card.briefing_id)
      .eq('user_id', userId)
      .single();

    if (!briefing) {
      return NextResponse.json({ error: 'Card does not belong to your briefing' }, { status: 403 });
    }

    // Upsert feedback (ON CONFLICT update action)
    const { error: feedbackError } = await supabase
      .from('feedback')
      .upsert(
        { user_id: userId, card_id, action },
        { onConflict: 'user_id,card_id' }
      );

    if (feedbackError) {
      return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 });
    }

    // Update daily completion
    const today = new Date().toISOString().split('T')[0];

    // Count total cards in today's briefing
    const { count: totalCards } = await supabase
      .from('cards')
      .select('id', { count: 'exact', head: true })
      .eq('briefing_id', briefing.id);

    // Count cards with feedback in today's briefing
    const { data: briefingCards } = await supabase
      .from('cards')
      .select('id')
      .eq('briefing_id', briefing.id);

    const briefingCardIds = (briefingCards || []).map((c) => c.id);

    let reviewedCount = 0;
    if (briefingCardIds.length > 0) {
      const { count } = await supabase
        .from('feedback')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('card_id', briefingCardIds);

      reviewedCount = count || 0;
    }

    // Upsert daily_completions record
    const { error: completionError } = await supabase
      .from('daily_completions')
      .upsert(
        {
          user_id: userId,
          date: today,
          cards_reviewed: reviewedCount,
          cards_total: totalCards || 0,
        },
        { onConflict: 'user_id,date' }
      );

    if (completionError) {
      return NextResponse.json({ error: 'Failed to update completion' }, { status: 500 });
    }

    // If all cards reviewed, update streak
    if (reviewedCount >= (totalCards || 0) && (totalCards || 0) > 0) {
      const { data: streak } = await supabase
        .from('streaks')
        .select('current_streak, longest_streak, last_review_date')
        .eq('user_id', userId)
        .single();

      if (streak) {
        const lastReview = streak.last_review_date;

        if (lastReview === today) {
          // Already updated today, do nothing
        } else {
          let newCurrentStreak: number;

          // Check if last review was yesterday
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastReview === yesterdayStr) {
            newCurrentStreak = streak.current_streak + 1;
          } else {
            newCurrentStreak = 1;
          }

          const newLongestStreak = Math.max(newCurrentStreak, streak.longest_streak);

          await supabase
            .from('streaks')
            .update({
              current_streak: newCurrentStreak,
              longest_streak: newLongestStreak,
              last_review_date: today,
            })
            .eq('user_id', userId);
        }
      }
    }

    // Update user expertise
    if (card && action === 'thumbs_up') {
      const { data: expertise } = await supabase
        .from('user_expertise')
        .select('id, cards_reviewed, level')
        .eq('user_id', userId)
        .eq('category_name', card.category_name)
        .single();

      if (expertise) {
        const newReviewed = expertise.cards_reviewed + 1;
        // Level up thresholds: 10, 30, 75, 150, 300
        const thresholds = [0, 10, 30, 75, 150, 300];
        let newLevel = 1;
        for (let i = thresholds.length - 1; i >= 0; i--) {
          if (newReviewed >= thresholds[i]) { newLevel = i + 1; break; }
        }
        newLevel = Math.min(newLevel, 5);

        await supabase
          .from('user_expertise')
          .update({ cards_reviewed: newReviewed, level: newLevel, updated_at: new Date().toISOString() })
          .eq('id', expertise.id);
      }
    }

    return NextResponse.json({ success: true, action });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
