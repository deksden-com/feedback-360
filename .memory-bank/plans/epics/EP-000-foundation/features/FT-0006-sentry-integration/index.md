---
description: FT-0006-sentry-integration feature plan and evidence entry for EP-000-foundation.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-000-foundation/index.md
epic: EP-000
feature: FT-0006
---


# FT-0006 — Sentry integration (Next.js)
Status: Completed (2026-03-04)

## User value
Ошибки из web runtime наблюдаемы в beta/prod, что уменьшает время диагностики проблем.

## Deliverables
- Sentry SDK подключен в `apps/web`.
- DSN и build-time параметры берутся из env vars.
- Privacy-safe настройки (без лишнего PII по умолчанию).

## Context (SSoT links)
- [Runbook](../../../../../spec/operations/runbook.md) — обязательные проверки перед релизом. Читать, чтобы мониторинг не терялся при деплоях.
- [Deployment architecture](../../../../../spec/operations/deployment-architecture.md) — какие env vars требуются для beta/prod. Читать, чтобы sourcemaps/telemetry работали стабильно.

## Acceptance (auto)
### Action
1) Собрать и запустить `apps/web` с заполненными Sentry env vars.
2) Вызвать тестовый маршрут/ошибку.

### Assert
- Ошибка фиксируется в Sentry проекте нужного окружения.
- Сборка не падает, когда Sentry env vars заданы корректно.

## Verification (must)
- CI: `lint`, `typecheck`, `test` зелёные.
- Ops check: событие появляется в Sentry после тестовой генерации ошибки.

## Quality checks evidence (2026-03-04)
- `pnpm -r lint` — passed (workspace gate, коммитный набор EP-000).
- `pnpm -r typecheck` — passed (workspace gate, коммитный набор EP-000).
- `pnpm -r test` — passed (workspace gate, коммитный набор EP-000).
- `pnpm --filter @feedback-360/web build` (с Sentry env) — passed.

## Acceptance evidence (2026-03-04)
- Build with Sentry env:
  - `SENTRY_DSN/NEXT_PUBLIC_SENTRY_DSN/SENTRY_ENVIRONMENT=beta pnpm --filter @feedback-360/web build` → build completed successfully.
- Runtime + capture flow:
  1) `SENTRY_DEBUG=1 pnpm --filter @feedback-360/web exec next dev --hostname 127.0.0.1 --port 4011`
  2) `curl http://127.0.0.1:4011/api/sentry-example-api` → HTTP 500 (intentional error route).
  3) Server logs содержат `Captured error event ...` и `Done flushing events`, что подтверждает отправку события SDK.
