import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnv({ path: path.resolve(__dirname, '../../../../.env') });

export const env = z
  .object({
    DATABASE_URL: z.string().min(1),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    CLERK_SECRET_KEY: z.string().min(1),
    CLERK_WEBHOOK_SIGNING_SECRET: z.string().min(1),
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_WEBHOOK_SECRET: z.string().min(1),
    STRIPE_PRICE_PRO: z.string().min(1).optional(),
    STRIPE_PRICE_ULTRA: z.string().min(1).optional(),
    STRIPE_PRICE_BOOST_PACK: z.string().min(1).optional(),
    STRIPE_BILLING_ENABLED: z.enum(['true', 'false']).default('false'),
    APP_URL: z.string().url().default('http://localhost:3000'),
    LOOPS_API_KEY: z.string().min(1),
    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    SUPABASE_STORAGE_BUCKET: z.string().min(1),
  })
  .parse(process.env);
