# Auth & tenancy context
Status: Draft (2026-03-03)

## Active company
User может состоять в нескольких компаниях. Поэтому операции всегда исполняются в контексте:
- “active company” (выбранная в UI/CLI),
- membership role (hr_admin/hr_reader/manager/employee).

## Rules
- `company_id` либо передаётся явно в input, либо устанавливается через контекст клиента (рекомендуемо).
- В CLI/UI активная компания устанавливается через client-local операцию `client.setActiveCompany` (см. operation catalog).
- В CLI активный actor context (`role`, `userId`) хранится локально и применяется через client-local `setActiveContext` (по умолчанию берётся из `company use --role/--user-id`).
- Сервер всегда перепроверяет membership и не доверяет клиенту.
