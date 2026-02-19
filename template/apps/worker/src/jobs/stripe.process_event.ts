import Stripe from 'stripe';
import { prisma } from '../lib/db';
import { env } from '../env';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

function inferPlan(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price.lookup_key ?? subscription.items.data[0]?.price.id ?? 'unknown';
}

function getScopeFromMetadata(metadata?: Record<string, string>) {
  return metadata?.scope === 'user' ? 'user' : 'org';
}

export async function handleStripeEvent(stripeEventId: string) {
  const storedEvent = await prisma.stripeEvent.findUnique({ where: { stripeEventId } });
  if (!storedEvent) {
    return;
  }

  if (storedEvent.processedAt) {
    return;
  }

  const event = await stripe.events.retrieve(stripeEventId);

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
    const metadata = subscription.metadata ?? {};

    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      update: {
        stripeCustomerId: customerId,
        stripePriceId: subscription.items.data[0]?.price.id,
        status: subscription.status,
        plan: inferPlan(subscription),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
        metadataJson: metadata,
      },
      create: {
        scope: getScopeFromMetadata(metadata),
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customerId,
        stripePriceId: subscription.items.data[0]?.price.id,
        status: subscription.status,
        plan: inferPlan(subscription),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
        metadataJson: metadata,
      },
    });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.mode === 'payment') {
      const metadata = session.metadata ?? {};
      const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
      const invoiceId = typeof session.invoice === 'string' ? session.invoice : null;

      await prisma.purchase.upsert({
        where: { stripeCheckoutSessionId: session.id },
        update: {
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
          stripePaymentIntentId: paymentIntentId,
          stripeInvoiceId: invoiceId,
          productCode: metadata.billingCode ?? 'UNKNOWN_PRODUCT',
          status: session.payment_status,
          amountSubtotal: session.amount_subtotal,
          amountTotal: session.amount_total,
          currency: session.currency,
          metadataJson: metadata,
        },
        create: {
          scope: getScopeFromMetadata(metadata),
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
          stripeInvoiceId: invoiceId,
          productCode: metadata.billingCode ?? 'UNKNOWN_PRODUCT',
          status: session.payment_status,
          amountSubtotal: session.amount_subtotal,
          amountTotal: session.amount_total,
          currency: session.currency,
          metadataJson: metadata,
        },
      });
    }
  }

  await prisma.stripeEvent.update({
    where: { stripeEventId },
    data: { processedAt: new Date() },
  });

  await prisma.emailEvent.create({
    data: {
      eventName: event.type,
      scope: 'org',
      payloadJson: {
        stripeEventId: event.id,
      },
      status: 'pending',
    },
  });
}
