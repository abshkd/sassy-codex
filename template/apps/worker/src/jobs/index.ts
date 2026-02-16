import type PgBoss from 'pg-boss';
import { prisma } from '../lib/db';
import { handleStripeEvent } from './stripe.process_event';
import { handleLoopsEvent } from './loops.send_event';
import { maintenanceCleanup } from './maintenance.cleanup';

export async function registerJobs(boss: PgBoss) {
  await boss.work('stripe.process_event', async (job) => {
    await handleStripeEvent(job.data.stripeEventId);

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
    await handleLoopsEvent(job.data.emailEventId);
  });

  await boss.schedule('maintenance.cleanup', '0 * * * *');
  await boss.work('maintenance.cleanup', async () => {
    await maintenanceCleanup();
  });
}
