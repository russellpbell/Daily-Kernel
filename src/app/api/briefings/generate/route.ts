import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getUserIdFromRequest } from '@/lib/auth';
import { generateBriefing } from '@/lib/briefing-engine';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();
    const today = new Date().toISOString().split('T')[0];

    // Delete existing briefing for today (cascade deletes cards)
    await supabase
      .from('briefings')
      .delete()
      .eq('user_id', userId)
      .eq('date', today);

    // Generate new briefing
    const briefingId = await generateBriefing(supabase, userId);

    // Load the new briefing with cards
    const { data: briefing } = await supabase
      .from('briefings')
      .select('id, date, generated_at')
      .eq('id', briefingId)
      .single();

    if (!briefing) {
      return NextResponse.json({ error: 'Failed to load briefing' }, { status: 500 });
    }

    const { data: cards } = await supabase
      .from('cards')
      .select('id, category_name, title, summary, source_url, source_name, position')
      .eq('briefing_id', briefing.id)
      .order('position');

    return NextResponse.json({
      id: briefing.id,
      date: briefing.date,
      cards: (cards || []).map((card) => ({ ...card, feedback: null })),
      generated_at: briefing.generated_at,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
