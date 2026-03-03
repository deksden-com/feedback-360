# FT-0021 — Identity model (User/Employee/Membership + active company)
Status: Draft (2026-03-03)

## User value
HR Admin может заранее создавать аккаунты, а пользователи могут состоять в нескольких компаниях и переключаться между ними.

## Deliverables
- Таблицы/связи: users (Supabase Auth), employees (per company), company_memberships, employee_user_links (MVP 1:1 в рамках company).
- Client context: `company use <company_id>` / op `client.setActiveCompany` (client-local).

## Context (SSoT links)
- [Auth & identity](../../../../../spec/security/auth-and-identity.md): что такое Supabase Auth user, почему User ≠ Employee и MVP правила (users pre-created). Читать, чтобы модель данных соответствовала agreed auth процессу.
- [Client auth & tenancy](../../../../../spec/client-api/auth-and-tenancy.md): active company как client-local контекст. Читать, чтобы “переключение компании” не стало серверным состоянием.
- [ERD / tables](../../../../../spec/data/erd.md): таблицы `employees`, `company_memberships`, `employee_user_links`. Читать, чтобы реализация БД совпадала с доменной моделью.
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): SSoT ops, включая `client.setActiveCompany`. Читать, чтобы UI/CLI не расходились в “как выбираем компанию”.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист реализации. Читать, чтобы identity модель прошла через contract/core/db/tests.

## Acceptance (auto)
### Setup
- Seed: `S1_multi_tenant_min --json`
  - handles: `company.a`, `company.b`, `user.shared`, `employee.shared@company.a`, `employee.shared@company.b`.

### Action (integration test)
1) Установить active company = A (`client.setActiveCompany`).
2) Вызвать любую company-scoped read операцию (например `results.getHrView` для кампании в company A, или другую read витрину).
3) Установить active company = B и повторить.

### Assert
- Операции в контексте A не возвращают данных company B и наоборот.
- При попытке обратиться к entity чужой компании — `forbidden` или `not_found` (с typed `code`).

### Client API ops (v1)
- `client.setActiveCompany` (client-local)

## Implementation plan (target repo)
- DB schema:
  - `employees` (HR-справочник, scoped на company).
  - `company_memberships(user_id, company_id, role)` (multi-tenant membership).
  - `employee_user_links(company_id, employee_id, user_id)` с unique на `(company_id, user_id)` и `(company_id, employee_id)` (MVP “1 user ↔ 1 employee в компании”).
- Auth flow:
  - HR Admin создаёт Users заранее (Supabase Auth) и Employees (HR directory) заранее.
  - При login по magic link обновляем email у user при необходимости (MVP: “просто обновляем”).
- Client:
  - `client.setActiveCompany` — client-local, влияет на все company-scoped ops (как заголовок/контекст, но не хранится на сервере).
- Тонкие моменты:
  - Один и тот же email/user может быть в нескольких компаниях (membership), но employee записи разные (per company).
  - Любая операция должна работать корректно при смене active company (кэш/локальный стейт клиента не должен “утекать”).

## Tests
- Integration: multi-tenant изоляция (в контексте A нельзя прочитать B).
- Contract: `client.setActiveCompany` output/error shape стабильный (если делаем как op).

## Memory bank updates
- Если уточняем уникальности связей или модель link-таблицы — обновить: [Auth & identity](../../../../../spec/security/auth-and-identity.md) — SSoT MVP правил. Читать, чтобы не возникло “скрытой” поддержки many-to-many без намерения.

## Verification (must)
- Automated test: `packages/core/test/ft/ft-0021-multi-tenant.test.ts` (integration) повторяет Acceptance (active company A/B, изоляция).
- Must run: GS4 (multi-tenant & RBAC) должен быть зелёным.
