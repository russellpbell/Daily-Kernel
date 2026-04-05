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

  // Find the free pass code
  const { data: pass } = await supabase
    .from('free_passes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .single();

  if (!pass) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 404 });
  }

  if (pass.is_redeemed) {
    return NextResponse.json({ error: 'Code has already been redeemed' }, { status: 400 });
  }

  if (pass.expires_at && new Date(pass.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Code has expired' }, { status: 400 });
  }

  // Redeem the code
  const { error: updatePassError } = await supabase
    .from('free_passes')
    .update({ is_redeemed: true, redeemed_by: userId })
    .eq('id', pass.id);

  if (updatePassError) {
    return NextResponse.json({ error: 'Failed to redeem code' }, { status: 500 });
  }

  // Update user subscription status
  const { error: updateUserError } = await supabase
    .from('users')
    .update({
      subscription_status: 'free_pass',
      free_pass_code: code.toUpperCase().trim(),
    })
    .eq('id', userId);

  if (updateUserError) {
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
