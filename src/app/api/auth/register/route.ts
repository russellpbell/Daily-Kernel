import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { hashPin, createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, pin } = body;

    if (!name || !pin) {
      return NextResponse.json({ error: 'Name and pin are required' }, { status: 400 });
    }

    if (pin.length < 4) {
      return NextResponse.json({ error: 'PIN must be at least 4 characters' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Check if username exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('name', name)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    // Hash PIN and create user
    const pinHash = await hashPin(pin);

    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({ name, pin_hash: pinHash })
      .select('id, name')
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Create initial streak record
    const { error: streakError } = await supabase
      .from('streaks')
      .insert({ user_id: user.id, current_streak: 0, longest_streak: 0 });

    if (streakError) {
      return NextResponse.json({ error: 'Failed to create streak record' }, { status: 500 });
    }

    // Generate JWT token
    const token = await createToken(user.id);

    return NextResponse.json({ token, user_id: user.id, name: user.name }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
