# C4 L2 — Containers
Status: Draft (2026-03-03)

## Containers
- **Web App (Next.js App Router)**: UI + route handlers (тонкие адаптеры). Не содержит бизнес-логики.
- **Core (domain use-cases)**: доменная логика, политики (анонимность/веса), state machines, расчёты.
- **Typed Client API**: типизированный клиент, который вызывают CLI и UI (HTTP или in-proc).
- **CLI**: инструмент для воспроизводимых сценариев (human + `--json`).
- **DB (Postgres)**: данные, миграции, RLS.
- **Auth (Supabase Auth)**: user/session management.
- **Notifications dispatcher**: cron/worker, который читает outbox и отправляет через Resend.
- **AI integration**: launcher job + webhook handler.

## Key constraints
- Клиенты (UI/CLI) **не содержат значимой логики** — только вызывают Typed Client API.
- Multi-tenant: `company_id` почти везде; права через membership + RLS/ACL.

