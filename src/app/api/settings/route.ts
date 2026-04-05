import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('cards_per_briefing')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ cards_per_briefing: user.cards_per_briefing });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();
    const body = await request.json();
    const { cards_per_briefing } = body;

    if (cards_per_briefing === undefined) {
      return NextResponse.json({ error: 'cards_per_briefing is required' }, { status: 400 });
    }

    if (typeof cards_per_briefing !== 'number' || cards_per_briefing < 1 || cards_per_briefing > 50) {
      return NextResponse.json({ error: 'cards_per_briefing must be between 1 and 50' }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update({ cards_per_briefing })
      .eq('id', userId)
      .select('cards_per_briefing')
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ cards_per_briefing: user.cards_per_briefing });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
