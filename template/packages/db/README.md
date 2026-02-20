# @saas/db

Prisma schema, SQL migrations, and database utilities for the generated SaaS app.

## Commands

- Apply migrations locally: `pnpm --filter @saas/db prisma migrate dev`
- Regenerate Prisma client: `pnpm --filter @saas/db prisma generate`
- Seed local data: `pnpm --filter @saas/db db:seed`

## Billing tables

This package includes billing-oriented models for Stripe + Supabase Postgres:
- `Subscription` for recurring plans (`FREE`/`PRO`/`ULTRA` patterns)
- `Purchase` for one-time checkout flows
- `StripeEvent` for webhook dedupe and processing status

Use the migration files in `prisma/migrations` for reproducible setup across environments.
