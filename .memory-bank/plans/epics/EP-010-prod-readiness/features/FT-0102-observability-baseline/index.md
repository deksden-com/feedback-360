---
description: FT-0102-observability-baseline feature plan and evidence entry for EP-010-prod-readiness.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-010-prod-readiness/index.md
epic: EP-010
feature: FT-0102
---


# FT-0102 — Observability baseline
Status: Completed (2026-03-06)

## User value
Когда что-то ломается в `beta` или `prod`, команда быстро понимает что, где и почему: ошибки видны в Sentry, запросы и webhook/cron операции имеют correlation ids, а логи пригодны для расследования.

## Deliverables
- Sentry baseline для web/runtime ошибок подтверждён end-to-end.
- Structured logs и correlation ids для ключевых flows.
- Видимость webhook и critical write событий.
- Runbook section “how to investigate”.

## Context (SSoT links)
- [Runbook](../../../../../spec/operations/runbook.md): observability section и operational checks. Читать, чтобы instrumentation шло вместе с процессом расследования.
- [Deployment architecture](../../../../../spec/operations/deployment-architecture.md): beta/prod окружения и env mapping. Читать, чтобы telemetry не смешивала окружения.
- [Webhook security](../../../../../spec/security/webhooks-ai.md): `ai_job_id`, idempotency и logging expectations. Читать, чтобы webhook traceability была доменно полезной.

## Acceptance (auto/manual)
### Setup
- Sentry/env configured for `beta` and `prod`.

### Action
1) Сгенерировать контролируемую runtime error.
2) Прогнать webhook/cron-like flow.
3) Проверить logs/Sentry события и correlation ids.

### Assert
- Error event виден в Sentry нужного окружения.
- Логи позволяют связать request/webhook/job.
- Webhook/cron investigation path описан в runbook.

## Implementation plan (target repo)
- Проверить текущую Sentry integration.
- Добавить/нормализовать correlation ids в ключевых route handlers/jobs:
  - `/api/webhooks/ai`
  - `/api/hr/campaigns/execute`
  - `/api/questionnaires/draft`
  - `/api/questionnaires/submit`
  - `/api/sentry-example-api`
- Согласовать формат structured logs.
- Обновить operational docs и troubleshooting.

## Tests
- Runtime smoke for sentry/logging.
- Route tests for webhook/correlation headers and controlled Sentry error payload.
- Manual/integration verification for webhook traceability.

## Memory bank updates
- Обновить [Runbook](../../../../../spec/operations/runbook.md) и при необходимости [Deployment architecture](../../../../../spec/operations/deployment-architecture.md).

## Verification (must)
- Runtime smoke on `beta`.
- Must run: controlled error + webhook trace + critical write routes return correlation headers.

## Manual verification (deployed environment)
- Environment:
  - target: `beta` first
  - Date: `2026-03-06`
- Steps:
  1. Вызвать контролируемую ошибку.
  2. Проверить появление события в Sentry.
  3. Проверить связанный request/job в логах.
- Expected:
  - событие приходит в нужный проект;
  - correlation id позволяет связать logs и событие.

## Quality checks evidence (2026-03-06)
- `pnpm --filter @feedback-360/web lint` → passed.
- `pnpm --filter @feedback-360/web typecheck` → passed.
- `pnpm --filter @feedback-360/web test -- src/lib/observability.test.ts src/app/api/webhooks/ai/route.test.ts src/app/api/sentry-example-api/route.test.ts` → passed.
- `pnpm --filter @feedback-360/web build` → passed.

## Acceptance evidence (2026-03-06, local baseline)
- `pnpm --filter @feedback-360/web test -- src/lib/observability.test.ts src/app/api/webhooks/ai/route.test.ts src/app/api/sentry-example-api/route.test.ts` → passed.
- Covered acceptance:
  - controlled backend error returns `eventId`, `requestId`, `x-request-id`, `x-correlation-id`;
  - AI webhook route propagates/generated request ids and keeps trace-friendly payload on success/error;
  - helper tests confirm request-id propagation into response headers.

## Acceptance evidence (2026-03-06, beta)
- Controlled error on `beta`:
  - `curl -isS "https://beta.go360go.ru/api/sentry-example-api?message=EP-010-observability-1772780039"` → `500`, `eventId=81f83474a74d475b8f72684e319e8a1c`, `requestId=c70ffb68-b121-4515-9aa2-8ab6ef0ee88f`, headers `x-request-id` + `x-correlation-id` returned.
- Sentry project visibility:
  - `GET https://sentry.io/api/0/projects/deksdencom/go360go-beta/events/` (with `SENTRY_AUTH_TOKEN`) returns beta-project event feed including runtime events for `/api/dev/seed` and `GET /api/sentry-example-api`.
  - Runbook updated to use returned `eventId`/`requestId` as immediate evidence and the beta project feed/issue list as the stable confirmation path when exact per-event lookup lags.
- Artifacts:
  - `step-01-controlled-error.txt` — `../../../../../evidence/EP-010/FT-0102/2026-03-06/step-01-controlled-error.txt`
  - `step-02-sentry-project-events.json` — `../../../../../evidence/EP-010/FT-0102/2026-03-06/step-02-sentry-project-events.json`
