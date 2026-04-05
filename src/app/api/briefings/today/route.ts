import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getUserIdFromRequest } from '@/lib/auth';
import { generateBriefing } from '@/lib/briefing-engine';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();
    const today = new Date().toISOString().split('T')[0];

    // Check if briefing exists for today
    let { data: briefing } = await supabase
      .from('briefings')
      .select('id, date, generated_at')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    // Generate if no briefing exists
    if (!briefing) {
      const briefingId = await generateBriefing(supabase, userId);
      const { data: newBriefing } = await supabase
        .from('briefings')
        .select('id, date, generated_at')
        .eq('id', briefingId)
        .single();

      briefing = newBriefing;
    }

    if (!briefing) {
      return NextResponse.json({ error: 'Failed to load briefing' }, { status: 500 });
    }

    // Load cards for this briefing
    const { data: cards } = await supabase
      .from('cards')
      .select('id, category_name, title, summary, source_url, source_name, position')
      .eq('briefing_id', briefing.id)
      .order('position');

    // Load feedback for this user's cards
    const cardIds = (cards || []).map((c) => c.id);
    let feedbackMap: Record<string, string> = {};

    if (cardIds.length > 0) {
      const { data: feedbackRows } = await supabase
        .from('feedback')
        .select('card_id, action')
        .eq('user_id', userId)
        .in('card_id', cardIds);

      if (feedbackRows) {
        feedbackMap = Object.fromEntries(feedbackRows.map((f) => [f.card_id, f.action]));
      }
    }

    // Merge cards with feedback
    const cardsWithFeedback = (cards || []).map((card) => ({
      ...card,
      feedback: feedbackMap[card.id] || null,
    }));

    return NextResponse.json({
      id: briefing.id,
      date: briefing.date,
      cards: cardsWithFeedback,
      generated_at: briefing.generated_at,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
