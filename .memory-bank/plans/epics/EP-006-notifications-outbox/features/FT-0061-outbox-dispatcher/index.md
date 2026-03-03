# FT-0061 — Outbox schema + dispatcher (email)
Status: Draft (2026-03-03)

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
- Automated test: `packages/core/test/ft/ft-0061-outbox-dispatch.test.ts` (integration) генерирует outbox и прогоняет dispatcher с мок провайдером.
- Must run: `pnpm -r test` + проверка attempts/status transitions.
