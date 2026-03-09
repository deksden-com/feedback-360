---
description: FT-0061-outbox-dispatcher feature plan and evidence entry for EP-006-notifications-outbox.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-006-notifications-outbox/index.md
epic: EP-006
feature: FT-0061
---


# FT-0061 — Outbox schema + dispatcher (email)
Status: Completed (2026-03-05)

## User value
Уведомления доставляются надёжно, даже при временных сбоях провайдера.

## Deliverables
- Таблицы: `notification_outbox`, `notification_attempts`.
- Dispatcher job: берёт pending, отправляет через Resend, пишет attempts.

## Context (SSoT links)
- [Notifications spec](../../../../../spec/notifications/notifications.md): события и когда шлём (invite/reminder/etc). Читать, чтобы генерация outbox соответствовала доменным триггерам.
- [Outbox & retries](../../../../../spec/notifications/outbox-and-retries.md): схема outbox, статусы, ретраи. Читать, чтобы таблицы и dispatcher не расходились со SSoT.
- [Templates RU v1](../../../../../spec/notifications/templates-ru-v1.md): ключи шаблонов и payload. Читать, чтобы dispatcher мог рендерить письма детерминированно.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист. Читать, чтобы dispatcher был покрыт интеграционными тестами с мок провайдером.

## Acceptance (auto)
### Setup
- Seed: `S5_campaign_started_no_answers --json`

### Action (integration test)
1) Сгенерировать outbox записи (invite/reminder), например через `notifications.generateReminders`.
2) Запустить `notifications.dispatchOutbox` с мокнутым Resend.

### Assert
- Outbox статус обновляется на `sent`/`failed`.
- `notification_attempts` содержит запись о попытке.

## Implementation plan (target repo)
- DB:
  - `notification_outbox`:
    - поля: `channel=email`, `template_key`, `to`, `payload_json`, `status`, `idempotency_key`, `attempts`, `next_retry_at`.
  - `notification_attempts`: лог каждой попытки (время, статус, error summary).
- Core:
  - Генерация outbox (`notifications.generateReminders` в этой системе) не отправляет письма напрямую.
- Adapter (dispatcher):
  - Job выбирает pending (и ready-to-retry), отправляет через Resend adapter, пишет `notification_attempts`, обновляет outbox статус.
  - Provider ошибки разделить: transient (retry) vs permanent (failed).
- Тонкие моменты:
  - Dispatcher должен быть идемпотентным на уровне записи outbox (не создавать новые записи при ретрае).

## Tests
- Integration: генерация outbox + dispatch с мокнутым Resend (проверка статусов и attempts).

## Memory bank updates
- Если уточняем статусы/поля outbox — обновить: [Outbox & retries](../../../../../spec/notifications/outbox-and-retries.md) — SSoT. Читать, чтобы не появилось “две схемы outbox”.

## Verification (must)
- Automated test: `packages/core/src/ft/ft-0061-outbox-dispatch.test.ts` (integration) генерирует outbox и прогоняет dispatcher с мок провайдером.
- Must run: `pnpm -r test` + проверка attempts/status transitions.

## Project grounding (2026-03-05)
- [Notifications spec](../../../../../spec/notifications/notifications.md): доменные события и scheduling intent. Читать, чтобы outbox-операции не отрывались от продуктовых триггеров.
- [Outbox & retries](../../../../../spec/notifications/outbox-and-retries.md): idempotency/retries политика. Читать, чтобы FT-0061 не конфликтовал с FT-0062.
- [GS7 Notifications](../../../../../spec/testing/scenarios/gs7-notifications.md): acceptance intent по idempotency/timezone. Читать, чтобы сценарии фич продолжали golden направление.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий процесс evidence-first. Читать, чтобы закрытие фичи было подтверждено чеками/сценариями.

## Quality checks evidence (2026-03-05)
- `pnpm --filter @feedback-360/api-contract lint && pnpm --filter @feedback-360/api-contract typecheck && pnpm --filter @feedback-360/db lint && pnpm --filter @feedback-360/db typecheck && pnpm --filter @feedback-360/core lint && pnpm --filter @feedback-360/core typecheck && pnpm --filter @feedback-360/client lint && pnpm --filter @feedback-360/client typecheck && pnpm --filter @feedback-360/cli lint && pnpm --filter @feedback-360/cli typecheck` → passed.
- `set -a; source .env; set +a; pnpm db:migrate` → passed (new outbox tables applied).

## Acceptance evidence (2026-03-05)
- `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0061-outbox-dispatch.test.ts` → passed.
- `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts` → passed (seed reset compatible с новыми outbox таблицами).
- `pnpm --filter @feedback-360/client exec vitest run --testTimeout 30000` → passed (включая `ft-0061-notifications-client.test.ts`).
- `pnpm --filter @feedback-360/cli test` → passed (включая `ft-0061-notifications-cli.test.ts`).
- CLI scenario (real DB, seed `S5_campaign_started_no_answers`) via `pnpm --filter @feedback-360/cli exec tsx src/index.ts`:
  - `reminders generate --campaign <campaign_id> --json` first run → `generated=1`, `deduplicated=0`.
  - same command second run → `generated=0`, `deduplicated>=1` (idempotent by day bucket).
  - `notifications dispatch --campaign <campaign_id> --provider stub --json` → `processed=1`, `sent=1`, `failed=0`, `remainingPending=0`.

## Notes
- FT-0061 фиксирует базовый lifecycle `pending -> sent|failed` и attempts logging.
- Retry/backoff/dead-letter политика остаётся целевым объёмом FT-0062.
