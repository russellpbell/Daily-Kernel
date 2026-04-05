import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getUserIdFromRequest } from '@/lib/auth';
import crypto from 'crypto';

function generateCode(): string {
  // Generate 8-char uppercase alphanumeric code (easy to read/type, no ambiguous chars)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
  let code = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Admin check
  if (userId !== process.env.ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createServiceClient();
  const body = await request.json();
  const { count } = body;

  if (!count || typeof count !== 'number' || count < 1 || count > 50) {
    return NextResponse.json({ error: 'Count must be between 1 and 50' }, { status: 400 });
  }

  const codes: string[] = [];
  const rows = [];
  for (let i = 0; i < count; i++) {
    const code = generateCode();
    codes.push(code);
    rows.push({
      code,
      created_by: userId,
    });
  }

  const { error } = await supabase.from('free_passes').insert(rows);

  if (error) {
    console.error('Failed to create free passes:', error);
    return NextResponse.json({ error: 'Failed to create codes' }, { status: 500 });
  }

  return NextResponse.json({ codes });
}

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Admin check
  if (userId !== process.env.ADMIN_USER_ID) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createServiceClient();

  const { data: passes, error } = await supabase
    .from('free_passes')
    .select('id, code, is_redeemed, redeemed_by, expires_at, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch passes' }, { status: 500 });
  }

  return NextResponse.json({ passes });
}
