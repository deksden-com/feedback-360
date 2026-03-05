# EP-006 — Notifications outbox (email)
Status: Completed (2026-03-05)

## Goal
Надёжные email уведомления (Resend) через outbox: без дублей, с расписанием по таймзоне.

## Features (vertical slices)
- [Feature catalog](features/index.md): список фич EP-006 с acceptance сценариями. Читать, чтобы email-уведомления были надёжными и не спамили.

## Scenarios / tests
- GS7 (notifications idempotency & timezone)
- GS13 (campaign invites)

## Progress report (evidence-based)
- `as_of`: 2026-03-05
- `total_features`: 4
- `completed_features`: 4
- `evidence_confirmed_features`: 4
- verification link:
  - [Verification matrix](../../verification-matrix.md) — execution evidence по EP-006. Читать, чтобы отслеживать подтверждённый прогресс по одному SSoT-источнику.

## Memory bank updates (after EP completion)
- Подтвердить outbox и retry политику (без дублей): [Outbox & retries](../../../spec/notifications/outbox-and-retries.md) — идемпотентность, backoff, DLQ. Читать, чтобы не спамить сотрудников и не терять письма.
- Синхронизировать расписания и timezone/quiet hours: [Notifications spec](../../../spec/notifications/notifications.md) — события и когда шлём. Читать, чтобы cron логика и требования совпадали.
- Обновить каталог шаблонов RU v1 и переменные: [Templates RU v1](../../../spec/notifications/templates-ru-v1.md) — ключи и payload. Читать, чтобы клиенты могли тестировать шаблоны без “магии”.
