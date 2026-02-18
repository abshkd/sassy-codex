# AGENTS.md

This file is the operating guide for Codex inside a generated SaaS app.

## Project context
- Monorepo managed with pnpm workspaces.
- `apps/web`: Next.js App Router app (auth, product UI, webhooks, signed-upload endpoint).
- `apps/worker`: Node worker for asynchronous/background jobs using `pg-boss`.
- `packages/db`: Prisma schema and DB client.
- `packages/shared`: shared types/constants/schemas.

## Architecture rules
- Keep business logic in TypeScript services, not in SQL triggers/procedures.
- Keep request handlers light; enqueue expensive or retry-prone work to the worker.
- Treat webhooks and jobs as idempotent; dedupe by provider event IDs.
- Stripe webhooks are the source of truth for billing state.
- Clerk is the identity provider; app DB mirrors Clerk users/orgs through application code.

## Environment configuration
- Root `.env` is the canonical environment file for local development.
- Web requires both Clerk keys:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (client/browser)
  - `CLERK_SECRET_KEY` (server)
- Worker and web both need `DATABASE_URL`, `STRIPE_*`, and `LOOPS_API_KEY` when related features are enabled.
- Storage flows require `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`.

## Common commands
- Install deps: `pnpm install`
- Run web app: `pnpm dev`
- Run worker: `pnpm worker`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- Test: `pnpm test`

## Expectations for Codex changes
- Prefer small, scoped edits aligned to current app structure.
- Update docs/config when behavior or setup expectations change.
- After meaningful edits, run and report relevant checks (`typecheck`, `lint`, `test`, and targeted command runs).
