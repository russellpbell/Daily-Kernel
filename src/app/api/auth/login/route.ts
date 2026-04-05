import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyPin, createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, pin } = body;

    if (!name || !pin) {
      return NextResponse.json({ error: 'Name and pin are required' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, pin_hash')
      .eq('name', name)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await verifyPin(pin, user.pin_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await createToken(user.id);

    return NextResponse.json({ token, user_id: user.id, name: user.name });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
