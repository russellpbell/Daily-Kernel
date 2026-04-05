import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();

    // Get user expertise ordered by cards_reviewed desc
    const { data: expertise, error: expertiseError } = await supabase
      .from('user_expertise')
      .select('category_name, level, topics_covered, cards_reviewed')
      .eq('user_id', userId)
      .order('cards_reviewed', { ascending: false });

    if (expertiseError) {
      return NextResponse.json({ error: 'Failed to fetch expertise' }, { status: 500 });
    }

    // Get last 20 knowledge entries ordered by last_seen_at desc
    const { data: recentTopics, error: topicsError } = await supabase
      .from('user_knowledge')
      .select('topic, category_name, times_seen, last_seen_at')
      .eq('user_id', userId)
      .order('last_seen_at', { ascending: false })
      .limit(20);

    if (topicsError) {
      return NextResponse.json({ error: 'Failed to fetch knowledge' }, { status: 500 });
    }

    // Count distinct knowledge entries
    const { count: totalTopics, error: countError } = await supabase
      .from('user_knowledge')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      return NextResponse.json({ error: 'Failed to count topics' }, { status: 500 });
    }

    // Sum cards_reviewed from user_expertise
    const totalCardsReviewed = (expertise || []).reduce(
      (sum, e) => sum + (e.cards_reviewed || 0),
      0
    );

    return NextResponse.json({
      expertise: expertise || [],
      recent_topics: recentTopics || [],
      total_topics: totalTopics || 0,
      total_cards_reviewed: totalCardsReviewed,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
