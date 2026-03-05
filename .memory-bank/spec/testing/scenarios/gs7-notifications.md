# GS7 — Notifications idempotency & timezone
Status: Active (2026-03-05)

## Setup
- Seed: `S5_campaign_started_no_answers` (pending questionnaires)
- Campaign timezone set (и company timezone fallback)

## Action
1) Дважды запускаем “generate reminders”.
2) Запускаем dispatch outbox.

## Assertions
- Outbox не содержит дублей (idempotency key).
- Retry/backoff работает предсказуемо: transient ошибка создаёт отложенный retry, повтор до `next_retry_at` не отправляет.
- Планировщик учитывает timezone кампании и quiet hours.

Примечание по покрытию:
- Idempotency + retry часть закрыта в FT-0062.
- Timezone + quiet-hours часть закрыта в FT-0063.

## Client API ops (v1)
- `notifications.generateReminders`
- `notifications.dispatchOutbox`

## CLI example
1) `reminders generate --campaign <campaign_id>`
2) повтор 1) → outbox без дублей
3) `notifications dispatch`
