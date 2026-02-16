# AGENTS.md

- Keep business logic in TypeScript services, not in SQL triggers/procedures.
- Treat webhooks and jobs as idempotent; dedupe by external event IDs.
- Keep web requests light and enqueue heavy work to the worker.
