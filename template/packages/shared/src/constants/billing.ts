export const BILLING_PLANS = {
  FREE: {
    code: 'FREE',
    name: 'Free',
    stripePriceEnv: null,
    mode: 'subscription',
    interval: 'month',
    placeholderFeatures: ['Up to 3 projects', 'Community support'],
  },
  PRO: {
    code: 'PRO',
    name: 'Pro',
    stripePriceEnv: 'STRIPE_PRICE_PRO',
    mode: 'subscription',
    interval: 'month',
    placeholderFeatures: ['Unlimited projects', 'Team collaboration', 'Priority support'],
  },
  ULTRA: {
    code: 'ULTRA',
    name: 'Ultra',
    stripePriceEnv: 'STRIPE_PRICE_ULTRA',
    mode: 'subscription',
    interval: 'month',
    placeholderFeatures: ['SLA + premium support', 'Advanced analytics', 'Audit logs'],
  },
} as const;

export const BILLING_PRODUCTS = {
  BOOST_PACK: {
    code: 'BOOST_PACK',
    name: 'Boost Pack',
    stripePriceEnv: 'STRIPE_PRICE_BOOST_PACK',
    mode: 'payment',
    placeholderFeatures: ['One-time credit bundle', 'Can be invoiced through Stripe'],
  },
} as const;

export type BillingPlanCode = keyof typeof BILLING_PLANS;
export type BillingProductCode = keyof typeof BILLING_PRODUCTS;
