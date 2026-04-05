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
      .select('id, name, email, cards_per_briefing')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
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
    const { cards_per_briefing, name } = body;

    const updates: Record<string, unknown> = {};

    if (cards_per_briefing !== undefined) {
      if (typeof cards_per_briefing !== 'number' || cards_per_briefing < 1 || cards_per_briefing > 50) {
        return NextResponse.json({ error: 'cards_per_briefing must be between 1 and 50' }, { status: 400 });
      }
      updates.cards_per_briefing = cards_per_briefing;
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'name must be a non-empty string' }, { status: 400 });
      }
      updates.name = name.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select('id, name, email, cards_per_briefing')
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
