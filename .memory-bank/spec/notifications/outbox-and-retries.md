# Notifications outbox & retries
Status: Active (2026-03-05)

Цель: надёжная отправка уведомлений без дублей (idempotency) и с предсказуемыми ретраями.

## Outbox (SSoT rules)
- Любая отправка создаётся как запись в outbox (email в MVP).
- Dispatcher читает outbox и делает фактическую отправку через провайдера (Resend).
- Каждая попытка отправки логируется (attempts).
- Статусы outbox: `pending -> sent|failed|dead_letter`.
- Retry-планирование хранится в `next_retry_at`:
  - `pending + next_retry_at IS NULL` = готово к немедленной отправке.
  - `pending + next_retry_at > now` = отложенный ретрай (ещё не брать в dispatch).

## Idempotency
- `idempotency_key` строится так, чтобы повторный запуск генерации outbox не создавал дубль:
  - минимум: `campaign_id + event_type + recipient_employee_id + date_bucket`

## Retry policy (MVP default)
- Максимум попыток: 10
- Backoff: exponential `delay = min(60s * 2^(attempt-1), 24h)` (без jitter в MVP).
- Ошибки провайдера:
  - transient (`network`, `HTTP 429`, `HTTP 5xx`) → retry.
  - permanent (`invalid config`, `HTTP 4xx` кроме 429) → `failed` без повторов.
- После исчерпания попыток transient-ошибок: статус `dead_letter` (ручная разборка HR/Admin ops).

Примечание по этапам:
- FT-0061 реализует базовую доставку + attempts logging.
- FT-0062 закрывает idempotency + retry/backoff + dead-letter по этому SSoT.

Связанные документы (аннотированные ссылки):
- [Notification spec](notifications.md): какие события генерируют outbox и когда. Читать, чтобы не появлялись “непонятные” письма.
- [Runbook](../operations/runbook.md): cron jobs для генерации/dispatch/ретраев. Читать, чтобы эксплуатация была воспроизводимой.
