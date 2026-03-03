# RLS strategy (draft)
Status: Draft (2026-03-03)

Цель: гарантировать multi-tenant изоляцию и минимизировать риск ошибок в коде.

MVP стратегия:
- RLS “deny by default”.
- Доступ по `company_memberships` + роль.
- Операции cron/outbox/webhooks выполняются service-role ключом (server-only).

