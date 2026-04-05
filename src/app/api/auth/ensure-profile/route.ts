import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Get user email from Supabase auth
    const { data: { user } } = await supabase.auth.admin.getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if profile exists
    const { data: existing } = await supabase
      .from('users')
      .select('id, name, email, cards_per_briefing')
      .eq('id', userId)
      .single();

    if (existing) {
      return NextResponse.json({ user: existing });
    }

    // Create profile
    const displayName = user.email?.split('@')[0] || 'User';
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        id: userId,
        name: displayName,
        email: user.email || '',
      })
      .select('id, name, email, cards_per_briefing')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    // Create initial streak record
    await supabase
      .from('streaks')
      .insert({ user_id: userId, current_streak: 0, longest_streak: 0 });

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
