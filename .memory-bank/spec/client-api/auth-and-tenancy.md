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
- Для web/server-контуров роль и `userId` должны подтверждаться серверной сессией (клиентскому контексту нельзя доверять).
- Текущий CLI работает в основном в in-proc режиме (прямой вызов core/DB) и не является удалённо-аутентифицированным клиентом beta/prod API.

## Implementation entrypoints
- `packages/client/src/features/identity-tenancy.ts`
- `packages/core/src/features/identity-tenancy.ts`
- `apps/web/src/features/identity-tenancy/lib/operation-context.ts`
- `apps/web/src/app/select-company/page.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0081-auth-company-switcher-ui.spec.ts`
- `packages/core/src/ft/ft-0021-identity-model.test.ts`
