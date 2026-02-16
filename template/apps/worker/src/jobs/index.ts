import type PgBoss from 'pg-boss';
import { prisma } from '../lib/db';
import { handleStripeEvent } from './stripe.process_event';
import { handleLoopsEvent } from './loops.send_event';
import { maintenanceCleanup } from './maintenance.cleanup';

function getData(job: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(job)) {
    return job[0] && typeof job[0] === 'object' ? (job[0] as { data?: Record<string, unknown> }).data : undefined;
  }

  if (job && typeof job === 'object') {
    return (job as { data?: Record<string, unknown> }).data;
  }

  return undefined;
}

export async function registerJobs(boss: PgBoss) {
  await boss.work('stripe.process_event', async (job) => {
    const stripeEventId = getData(job)?.stripeEventId;
    if (typeof stripeEventId !== 'string') {
      return;
    }

    await handleStripeEvent(stripeEventId);

    const pendingEvents = await prisma.emailEvent.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: 25,
    });

    for (const emailEvent of pendingEvents) {
      await boss.send('loops.send_event', { emailEventId: emailEvent.id }, { singletonKey: `loops:${emailEvent.id}` });
    }
  });

  await boss.work('loops.send_event', async (job) => {
    const emailEventId = getData(job)?.emailEventId;
    if (typeof emailEventId !== 'string') {
      return;
    }

    await handleLoopsEvent(emailEventId);
  });

  await boss.schedule('maintenance.cleanup', '0 * * * *');
  await boss.work('maintenance.cleanup', async () => {
    await maintenanceCleanup();
  });
}
