import { z } from 'zod';
export const emailEventSchema = z.object({ eventName: z.string(), scope: z.enum(['org','user']), orgId: z.string().optional(), userId: z.string().optional(), payload: z.record(z.any()) });
