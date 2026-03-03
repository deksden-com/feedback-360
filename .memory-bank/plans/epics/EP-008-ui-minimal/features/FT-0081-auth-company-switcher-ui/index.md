# FT-0081 — Auth + company switcher UI (thin)
Status: Draft (2026-03-03)

## User value
Пользователь входит по magic link и выбирает активную компанию, если memberships > 1.

## Deliverables
- Экран логина (magic link).
- Company switcher, который вызывает `client.setActiveCompany` (через typed client).

## Context (SSoT links)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md): список экранов и переходов. Читать, чтобы UI соответствовал agreed MVP flow.
- [Auth & identity](../../../../../spec/security/auth-and-identity.md): magic link и users pre-created. Читать, чтобы UI не предполагал публичные регистрации.
- [Client auth & tenancy](../../../../../spec/client-api/auth-and-tenancy.md): active company как client-local контекст. Читать, чтобы переключение компании было консистентным с CLI.
- [Architecture guardrails](../../../../../spec/engineering/architecture-guardrails.md): UI не импортирует core. Читать, чтобы бизнес-логика не “утекла” в компоненты.

## Acceptance (auto, Playwright)
### Setup
- Seed: `S1_multi_tenant_min`

### Action
1) Логин по magic link.
2) Переключение active company A→B через UI.

### Assert
- UI отображает данные активной компании и не показывает чужие.
- Смена active company влияет на запросы typed client (scoped by company).

## Implementation plan (target repo)
- Auth UI:
  - Минимальный экран “введите email → отправить magic link” (через Supabase Auth).
  - Обработать callback magic link и создание сессии.
- Company switcher:
  - После login вызвать `membership.list` (или equivalent) и показать список компаний.
  - При выборе компании вызвать `client.setActiveCompany` (client-local) и перерендерить UI.
- Тонкие моменты:
  - UI не решает “какие компании доступны” — это следует из memberships и RBAC.
  - Если memberships=1, switcher можно скрыть, но active company всё равно устанавливается детерминированно.

## Tests
- Playwright: login + переключение компании → проверка, что данные/страницы относятся к выбранной компании.

## Memory bank updates
- При уточнении UI flow обновить: [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md) — SSoT. Читать, чтобы UI не расходился с планом экранов.

## Verification (must)
- Automated test: Playwright сценарий (часть GS1) покрывает login + company switcher.
- Must run: Playwright e2e (минимальный happy path) и smoke переключения компаний (multi-tenant).
