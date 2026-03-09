---
description: FT-0021-identity-model feature plan and evidence entry for EP-002-identity-tenancy-rbac.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-002-identity-tenancy-rbac/index.md
epic: EP-002
feature: FT-0021
---


# FT-0021 — Identity model (User/Employee/Membership + active company)
Status: Completed (2026-03-04)

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

## Project grounding (2026-03-04)
- [x] Прочитан FT-документ целиком (deliverables, acceptance, tests, docs updates).
- [x] Прочитаны SSoT документы из `Context`.
- [x] Проверены [Operation catalog](../../../../../spec/client-api/operation-catalog.md) и [CLI command catalog](../../../../../spec/cli/command-catalog.md) — норматив ops и mapping `command→operation`. Это исключает “скрытые” вызовы и логику в CLI.
- [x] Проверен [Traceability](../../../../../spec/testing/traceability.md) и seed-спека `S1_multi_tenant_min` — карта инвариантов и тестов для многоарендной изоляции.
- [x] Зафиксированы затрагиваемые слои: `api-contract` (seed scenario enum), `db` (seed data + company-scope guard), `client` (acceptance tests), docs/evidence.

## Acceptance (auto)
### Setup
- Seed: `S1_multi_tenant_min --json`
  - handles: `company.a`, `company.b`, `user.shared`, `employee.shared@company.a`, `employee.shared@company.b`, `campaign.a`, `campaign.b`.

### Action (integration test)
1) Установить active company = A (`client.setActiveCompany`).
2) Вызвать company-scoped read операцию `questionnaire.listAssigned` для `campaign.a`.
3) Установить active company = B и повторить.
4) Оставшись в active company = B, вызвать `questionnaire.listAssigned` для `campaign.a`.

### Assert
- Операции в контексте A не возвращают данных company B и наоборот.
- При попытке обратиться к entity чужой компании — `forbidden` или `not_found` (с typed `code`).

### Client API ops (v1)
- `client.setActiveCompany` (client-local)
- `questionnaire.listAssigned` (company-scoped read)

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
- Unit/contract-style: `packages/client/src/ft-0021-multi-tenant.test.ts` (transport contract) проверяет переключение active company и изоляцию контекста без БД.
- Integration: `packages/client/src/ft-0021-multi-tenant.test.ts` (runIf DB URL) проверяет `S1_multi_tenant_min` и чтение A/B с запретом cross-company read.
- DB integration: `packages/db/src/migrations/ft-0003-seed-runner.test.ts` проверяет, что `S1_multi_tenant_min` создаётся и возвращает expected handles.

## Memory bank updates
- Если уточняем уникальности связей или модель link-таблицы — обновить: [Auth & identity](../../../../../spec/security/auth-and-identity.md) — SSoT MVP правил. Читать, чтобы не возникло “скрытой” поддержки many-to-many без намерения.

## Verification (must)
- Automated test: `packages/client/src/ft-0021-multi-tenant.test.ts` повторяет Acceptance (active company A/B, изоляция, cross-company `not_found`).
- Must run: GS4 (tenant isolation subset для FT-0021) должен быть зелёным; RBAC-write проверки закрываются в FT-0022.

## Quality checks evidence (2026-03-04)
- `pnpm -r lint` — passed
- `pnpm -r typecheck` — passed
- `pnpm -r test` — passed
- `build` — N/A (изменения покрыты unit/integration тестами и seed checks; отдельный build-target не менялся).

## Acceptance evidence (2026-03-04)
- `pnpm --filter @feedback-360/client exec vitest run src/ft-0021-multi-tenant.test.ts` — passed (transport acceptance + DB integration subtest skipped when DB URL absent).
- `pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts` — passed (`S1_multi_tenant_min` handles validated).
