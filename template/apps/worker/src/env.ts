import { z } from 'zod';

export const env = z
  .object({
    DATABASE_URL: z.string().min(1),
    LOOPS_API_KEY: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
  })
  .parse(process.env);
