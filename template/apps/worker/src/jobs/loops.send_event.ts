import { prisma } from '../lib/db';
import { env } from '../env';

export async function handleLoopsEvent(emailEventId: string) {
  const emailEvent = await prisma.emailEvent.findUnique({ where: { id: emailEventId } });
  if (!emailEvent || emailEvent.status === 'sent') {
    return;
  }

  try {
    const response = await fetch('https://app.loops.so/api/v1/events/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventName: emailEvent.eventName,
        userId: emailEvent.userId,
        mailingLists: [],
        eventProperties: emailEvent.payloadJson,
      }),
    });

    if (!response.ok) {
      throw new Error(`Loops API failed with ${response.status}`);
    }

    await prisma.emailEvent.update({
      where: { id: emailEvent.id },
      data: {
        status: 'sent',
        attempts: { increment: 1 },
        lastError: null,
      },
    });
  } catch (error) {
    await prisma.emailEvent.update({
      where: { id: emailEvent.id },
      data: {
        status: 'failed',
        attempts: { increment: 1 },
        lastError: error instanceof Error ? error.message : 'Unknown Loops failure',
      },
    });
    throw error;
  }
}
