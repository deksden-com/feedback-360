# GS10 — RLS smoke (planned)
Status: Draft (2026-03-03)

## Setup
- Seed: `S1_multi_tenant_min`

## Action
1) Под обычным user context (`serviceRole=off`, `app.current_user_id=<tenant user>`) пытаемся прочитать данные своей и чужой company.
2) Под service role (server job) читаем/пишем данные для cron/outbox/webhooks.

## Assertions
- RLS “deny by default” для SELECT скрывает чужие строки (0 rows), но оставляет видимыми строки своей company.
- Service role операции работают (в пределах server-only контуров).

## Notes
Это в первую очередь integration тест (DB/RLS), но его полезно дублировать как smoke через client API (где возможно).
