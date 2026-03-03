# GS7 — Notifications idempotency & timezone (planned)
Status: Draft (2026-03-03)

## Setup
- Seed: `S5_campaign_started_no_answers` (pending questionnaires)
- Campaign timezone set (и company timezone fallback)

## Action
1) Дважды запускаем “generate reminders”.
2) Запускаем dispatch outbox.

## Assertions
- Outbox не содержит дублей (idempotency key).
- Планировщик учитывает timezone кампании и quiet hours.

## Client API ops (v1)
- `notifications.generateReminders`
- `notifications.dispatchOutbox`

## CLI example
1) `reminders generate --campaign <campaign_id>`
2) повтор 1) → outbox без дублей
3) `notifications dispatch`
