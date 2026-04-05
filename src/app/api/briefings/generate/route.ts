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
    const generated = await generateBriefing(supabase, userId);
    const briefing = { id: generated.id, date: generated.date, generated_at: generated.generated_at };

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
