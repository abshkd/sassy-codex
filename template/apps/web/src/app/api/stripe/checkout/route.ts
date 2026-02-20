import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { checkoutRequestSchema } from '@saas/shared';
import { env } from '../../../../lib/env';
import { prisma } from '../../../../lib/db';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

const planPriceMap: Record<string, string | undefined> = {
  PRO: env.STRIPE_PRICE_PRO,
  ULTRA: env.STRIPE_PRICE_ULTRA,
};

const productPriceMap: Record<string, string | undefined> = {
  BOOST_PACK: env.STRIPE_PRICE_BOOST_PACK,
};

export async function POST(request: Request) {
  if (env.STRIPE_BILLING_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Billing is disabled by configuration' }, { status: 412 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = checkoutRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { orgSlug, scope } = parsed.data;

  if (scope === 'org') {
    if (!orgSlug) {
      return NextResponse.json({ error: 'orgSlug is required for org scope checkouts' }, { status: 400 });
    }

    const membership = await prisma.orgMember.findFirst({
      where: {
        user: { clerkUserId: userId },
        org: { slug: orgSlug },
      },
      select: { id: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  } else {
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const isPlanCheckout = Boolean(parsed.data.planCode);

  if (isPlanCheckout && parsed.data.planCode === 'FREE') {
    return NextResponse.json({ error: 'Free plan does not require checkout' }, { status: 400 });
  }

  const code = parsed.data.planCode ?? parsed.data.productCode;
  if (!code) {
    return NextResponse.json({ error: 'No purchasable code provided' }, { status: 400 });
  }

  const mode: Stripe.Checkout.SessionCreateParams.Mode = isPlanCheckout ? 'subscription' : 'payment';
  const priceId = isPlanCheckout ? planPriceMap[code] : productPriceMap[code];
  if (!priceId) {
    return NextResponse.json({ error: `Missing Stripe price configuration for ${code}` }, { status: 412 });
  }

  const session = await stripe.checkout.sessions.create({
    mode,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${env.APP_URL}/app/o/${orgSlug ?? 'personal'}/billing?checkout=success`,
    cancel_url: `${env.APP_URL}/app/o/${orgSlug ?? 'personal'}/billing?checkout=cancelled`,
    client_reference_id: `${scope}:${orgSlug ?? 'personal'}`,
    metadata: {
      scope,
      orgSlug: orgSlug ?? '',
      purchaseType: isPlanCheckout ? 'subscription' : 'product',
      billingCode: code,
    },
    subscription_data: isPlanCheckout
      ? {
          metadata: {
            scope,
            orgSlug: orgSlug ?? '',
            billingCode: code,
          },
        }
      : undefined,
    invoice_creation: isPlanCheckout ? undefined : { enabled: true },
  });

  return NextResponse.json({
    checkoutUrl: session.url,
    mode,
    selectedCode: code,
  });
}
