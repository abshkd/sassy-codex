# create-saas-stack

`create-saas-stack` is a local CLI generator in the `sassy-codex` repository that scaffolds a production-minded SaaS monorepo from the architecture in `Codex.md`.

Repository: https://github.com/abshkd/sassy-codex

It generates:
- Next.js (App Router) web app
- Node worker service with `pg-boss`
- Prisma + Supabase Postgres/Storage
- Clerk auth (with optional orgs)
- Stripe billing via webhook-first state handling
- Loops event delivery through background jobs
- Docker-first infrastructure and CI-friendly layout

## Getting started (local clone + local CLI)

### 1) Clone and install
```bash
git clone https://github.com/abshkd/sassy-codex.git
cd sassy-codex
pnpm install
```

### 2) Run the generator from this repo
```bash
pnpm exec create-saas-stack my-saas
# or
node src/cli.mjs my-saas
```

### 3) Enter generated project and run it
```bash
cd my-saas
pnpm install
pnpm dev
```

## Setting up the generated SaaS app for development

Inside the generated repo:

1. Copy environment defaults:
   ```bash
   cp .env.example .env
   ```
2. Fill provider keys (Clerk, Stripe, Supabase, Loops, Sentry).
3. Start app + worker:
   ```bash
   pnpm dev
   pnpm worker
   ```
4. Run quality checks before shipping:
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test
   ```

### Local architecture expectations
- Keep request handlers light and enqueue heavy work to the worker.
- Treat webhook and background processing as idempotent.
- Keep business logic in TypeScript services (not SQL triggers/procedures).

## Provider configuration for development

### Clerk
- Configure frontend and backend keys.
- If org mode is enabled, validate org membership flows.
- Mirror Clerk identities to app-owned tables (`User`, `Org`, `OrgMember`) through app logic.

### Supabase
- Configure Postgres connection string for Prisma.
- Configure Storage bucket and signed upload URL flow.
- Keep Supabase Auth disabled for baseline (Clerk is the auth source).

### Stripe
- Configure API key and webhook secret.
- Use Stripe webhooks as the source of truth for subscription status.
- Validate idempotency using Stripe event IDs.

### Loops
- Configure API key and event identifiers.
- Emit lifecycle events from app code and deliver from worker with retries.
- De-dupe sends with your own event IDs.

### Sentry
- Configure DSNs for web and worker.
- Keep instrumentation enabled in all environments to catch integration issues early.

## Motivation: save tokens and help Codex produce production-ready SaaS faster

This project follows a harness-style engineering mindset: constrain the problem, standardize interfaces, and codify repeatable checks.

Why this helps:
- **Smaller prompt surface:** a fixed stack reduces branching decisions, so Codex spends fewer tokens on architecture debates.
- **Deterministic generation:** repeated runs produce a familiar structure, making edits and reviews faster.
- **Operational guardrails:** webhook-first billing, worker-based async jobs, and idempotency defaults reduce rework.
- **Faster debug loops:** consistent layout and provider contracts let Codex patch known seams quickly.
- **Production readiness by default:** Dockerized services, strict TypeScript, and baseline checks move teams from idea to deploy with less manual hardening.

## Production deployment notes

Production deployment guidance should live in each **generated app's own docs** so it stays aligned with that app's concrete provider settings, infrastructure topology, and runtime constraints.

## Best way to use the generated app with Codex

- Treat the generated repository's `AGENTS.md` as the primary Codex operating contract.
- Keep prompts task-specific and include failing command output when asking for fixes.
- Ask Codex to run and report `typecheck`, `lint`, and `test` after meaningful changes.
- Prefer small iterative PRs so behavior is validated incrementally.

In short: use `AGENTS.md` as the source of truth for how Codex should work inside the generated app.
