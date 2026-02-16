import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import { env } from '../../../../lib/env';
import { prisma } from '../../../../lib/db';
import { getBoss } from '../../../../lib/boss';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Invalid stripe signature' }, { status: 400 });
  }

  try {
    await prisma.stripeEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ received: true, duplicate: true });
    }

    throw error;
  }

  const boss = await getBoss();
  await boss.send(
    'stripe.process_event',
    { stripeEventId: event.id },
    { singletonKey: `stripe:${event.id}` },
  );

  return NextResponse.json({ received: true });
}
