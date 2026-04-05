import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getUserIdFromRequest } from '@/lib/auth';
import { getStripe, PLANS } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServiceClient();
  const body = await request.json();
  const { plan } = body;

  if (!plan || !PLANS[plan as keyof typeof PLANS]) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const planConfig = PLANS[plan as keyof typeof PLANS];
  const stripe = getStripe();

  // Get user email
  const { data: user } = await supabase
    .from('users')
    .select('email, stripe_customer_id, subscription_status')
    .eq('id', userId)
    .single();

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // If already subscribed or free pass, don't allow
  if (user.subscription_status === 'active' || user.subscription_status === 'free_pass') {
    return NextResponse.json({ error: 'Already subscribed' }, { status: 400 });
  }

  // Get or create Stripe customer
  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      metadata: { user_id: userId },
    });
    customerId = customer.id;
    await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', userId);
  }

  // Check if user has ever had a trial (prevent repeat trials)
  const existingSubscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1,
  });
  const hadTrial = existingSubscriptions.data.some(s => s.trial_start !== null);

  // Create checkout session with 7-day free trial for new subscribers
  const origin = request.headers.get('origin') || 'http://localhost:3000';
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${origin}/settings?subscription=success`,
    cancel_url: `${origin}/settings?subscription=canceled`,
    metadata: { user_id: userId, plan },
    ...(hadTrial ? {} : { subscription_data: { trial_period_days: 7 } }),
  });

  return NextResponse.json({ url: session.url });
}
