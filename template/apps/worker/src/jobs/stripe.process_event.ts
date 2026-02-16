import Stripe from 'stripe';
import { prisma } from '../lib/db';
import { env } from '../env';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

function inferPlan(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price.lookup_key ?? subscription.items.data[0]?.price.id ?? 'unknown';
}

export async function handleStripeEvent(stripeEventId: string) {
  const event = await stripe.events.retrieve(stripeEventId);

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      update: {
        stripeCustomerId: customerId,
        status: subscription.status,
        plan: inferPlan(subscription),
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null,
      },
      create: {
        scope: 'org',
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        status: subscription.status,
        plan: inferPlan(subscription),
        currentPeriodEnd: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null,
      },
    });

    await prisma.emailEvent.create({
      data: {
        eventName: event.type,
        scope: 'org',
        payloadJson: {
          stripeEventId: event.id,
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          plan: inferPlan(subscription),
        },
        status: 'pending',
      },
    });
  }
}
