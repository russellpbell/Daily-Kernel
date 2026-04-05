import Stripe from 'stripe';

export function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export const PLANS = {
  monthly: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID!,
    name: 'Monthly',
    price: 1.00,
    interval: 'month' as const,
  },
  annual: {
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID!,
    name: 'Annual',
    price: 10.00,
    interval: 'year' as const,
  },
};
