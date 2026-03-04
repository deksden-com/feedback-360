# RLS strategy (draft)
Status: Draft (2026-03-03)

Цель: гарантировать multi-tenant изоляцию и минимизировать риск ошибок в коде.

MVP стратегия:
- RLS “deny by default”.
- Доступ по `company_memberships` + роль.
- Операции cron/outbox/webhooks выполняются service-role ключом (server-only).

## Session context (MVP)
- `app.current_user_id` — UUID текущего пользователя (для user-context запросов).
- `app.is_service_role` — `on|off`; `on` только в server-only контурах (cron/outbox/webhooks/internal adapters).

## Policy model (MVP)
- helper: `app.has_company_access(company_id)` (через `company_memberships`).
- доступ к строкам с `company_id`:
  - разрешён, если `app.is_service_role() = true`, или
  - разрешён, если `app.has_company_access(company_id) = true`.
- для `companies` используется `app.has_company_access(companies.id)`.

## Covered tables (phase 1)
- `companies`
- `company_memberships`
- `employees`
- `departments`
- `employee_user_links`
- `campaigns`
- `questionnaires`

## Notes
- Для `SELECT` RLS обычно не бросает ошибку, а скрывает строки (0 rows) — это ожидаемое поведение.
- Application adapters по умолчанию используют service-role context; user-context включается явно в тестах/спец. адаптерах.
