# Notifications outbox & retries
Status: Draft (2026-03-03)

Цель: надёжная отправка уведомлений без дублей (idempotency) и с предсказуемыми ретраями.

## Outbox (SSoT rules)
- Любая отправка создаётся как запись в outbox (email в MVP).
- Dispatcher читает outbox и делает фактическую отправку через провайдера (Resend).
- Каждая попытка отправки логируется (attempts).

## Idempotency
- `idempotency_key` строится так, чтобы повторный запуск генерации outbox не создавал дубль:
  - минимум: `campaign_id + event_type + recipient_employee_id + date_bucket`

## Retry policy (MVP default)
- Максимум попыток: 10
- Backoff: exponential (например, 1m, 5m, 15m, 1h, 6h, 24h, …) с джиттером
- После исчерпания попыток: статус `dead_letter` (ручная разборка HR/Admin ops)

Связанные документы (аннотированные ссылки):
- [Notification spec](notifications.md): какие события генерируют outbox и когда. Читать, чтобы не появлялись “непонятные” письма.
- [Runbook](../operations/runbook.md): cron jobs для генерации/dispatch/ретраев. Читать, чтобы эксплуатация была воспроизводимой.

