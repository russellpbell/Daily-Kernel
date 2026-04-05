import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getUserIdFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient();
  const body = await request.json();
  const { code } = body;

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }

  // Check if user already has an active subscription or free pass
  const { data: user } = await supabase
    .from('users')
    .select('subscription_status')
    .eq('id', userId)
    .single();

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (user.subscription_status === 'active' || user.subscription_status === 'free_pass') {
    return NextResponse.json({ error: 'Already subscribed' }, { status: 400 });
  }

  // Atomic update - only succeeds if pass exists and is not redeemed
  const { data: pass, error: passError } = await supabase
    .from('free_passes')
    .update({ is_redeemed: true, redeemed_by: userId })
    .eq('code', code.toUpperCase().trim())
    .eq('is_redeemed', false)
    .select('id, expires_at')
    .single();

  if (passError || !pass) {
    return NextResponse.json({ error: 'Invalid or already redeemed code' }, { status: 400 });
  }

  // Check expiration after atomic claim
  if (pass.expires_at && new Date(pass.expires_at) < new Date()) {
    // Revert the claim
    await supabase.from('free_passes').update({ is_redeemed: false, redeemed_by: null }).eq('id', pass.id);
    return NextResponse.json({ error: 'This code has expired' }, { status: 400 });
  }

  // Activate user subscription
  await supabase.from('users').update({
    subscription_status: 'free_pass',
    free_pass_code: code.toUpperCase().trim(),
  }).eq('id', userId);

  return NextResponse.json({ success: true });
}
