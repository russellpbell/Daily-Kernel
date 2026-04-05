import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();

    // Get streak info
    const { data: streak } = await supabase
      .from('streaks')
      .select('current_streak, longest_streak, last_review_date')
      .eq('user_id', userId)
      .single();

    // Get last 30 days of daily completions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: completions } = await supabase
      .from('daily_completions')
      .select('date, cards_reviewed, cards_total')
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgoStr)
      .order('date', { ascending: false });

    return NextResponse.json({
      current_streak: streak?.current_streak || 0,
      longest_streak: streak?.longest_streak || 0,
      last_review_date: streak?.last_review_date || null,
      monthly_completions: completions || [],
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
