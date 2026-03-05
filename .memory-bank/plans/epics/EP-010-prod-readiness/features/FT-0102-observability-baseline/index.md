# FT-0102 — Observability baseline
Status: Draft (2026-03-05)

## User value
Когда что-то ломается в `beta` или `prod`, команда быстро понимает что, где и почему: ошибки видны в Sentry, запросы и webhook/cron операции имеют correlation ids, а логи пригодны для расследования.

## Deliverables
- Sentry baseline для web/runtime ошибок подтверждён end-to-end.
- Structured logs и correlation ids для ключевых flows.
- Видимость webhook and cron событий.
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
- Добавить/нормализовать correlation ids в ключевых route handlers/jobs.
- Согласовать формат structured logs.
- Обновить operational docs и troubleshooting.

## Tests
- Runtime smoke for sentry/logging.
- Manual/integration verification for webhook traceability.

## Memory bank updates
- Обновить [Runbook](../../../../../spec/operations/runbook.md) и при необходимости [Deployment architecture](../../../../../spec/operations/deployment-architecture.md).

## Verification (must)
- Runtime smoke on `beta`.
- Must run: controlled error + webhook/cron trace.

## Manual verification (deployed environment)
- Environment:
  - target: `beta` first
  - Date: `2026-03-05`
- Steps:
  1. Вызвать контролируемую ошибку.
  2. Проверить появление события в Sentry.
  3. Проверить связанный request/job в логах.
- Expected:
  - событие приходит в нужный проект;
  - correlation id позволяет связать logs и событие.
