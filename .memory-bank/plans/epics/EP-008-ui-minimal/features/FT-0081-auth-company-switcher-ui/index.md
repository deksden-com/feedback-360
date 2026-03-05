# FT-0081 — Auth + company switcher UI (thin)
Status: Completed (2026-03-05)

## User value
Пользователь входит по magic link и выбирает активную компанию, если memberships > 1.

## Deliverables
- Экран логина (magic link).
- Company switcher, который вызывает `client.setActiveCompany` (через typed client).
- UI foundation для `apps/web`: Tailwind v4 + shadcn/ui bootstrap как базовый стек фич EP-008.

## Context (SSoT links)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md): список экранов и переходов. Читать, чтобы UI соответствовал agreed MVP flow.
- [Auth & identity](../../../../../spec/security/auth-and-identity.md): magic link и users pre-created. Читать, чтобы UI не предполагал публичные регистрации.
- [Client auth & tenancy](../../../../../spec/client-api/auth-and-tenancy.md): active company как client-local контекст. Читать, чтобы переключение компании было консистентным с CLI.
- [Architecture guardrails](../../../../../spec/engineering/architecture-guardrails.md): UI не импортирует core. Читать, чтобы бизнес-логика не “утекла” в компоненты.
- [Frontend UI stack](../../../../../spec/engineering/frontend-ui-stack.md): фиксированный baseline Tailwind/shadcn для `apps/web`. Читать, чтобы UI фича не ушла в альтернативный стек и была совместима с остальными FT EP-008.
- [Stitch design refs for FT-0081](../../../../../spec/ui/design-references-stitch.md#ft-0081-auth--company-switcher-ui): конкретные экраны для login/company switch и правила их применения. Читать, чтобы использовать согласованные макеты без выхода за MVP scope.

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

## Design references (stitch)
- [`stitch_go360go/magic_link/screen.png`](../../../../../../stitch_go360go/magic_link/screen.png): референс структуры login-card и текстовых подсказок. Используем как базу для magic-link экрана.
- [`stitch_go360go/_5/screen.png`](../../../../../../stitch_go360go/_5/screen.png): референс выбора активной компании после логина. Используем для карточек membership и CTA “войти”.

## Design constraints (what we do NOT take)
- Не переносим из макетов необязательные профайл/support/footer блоки как обязательный MVP scope.
- Не копируем `code.html` из stitch; верстаем только на `Tailwind v4 + shadcn/ui` в рамках текущего стека.

## Project grounding (2026-03-05)
- [Tailwind CSS + Next.js guide](https://tailwindcss.com/docs/installation/framework-guides/nextjs): официальный способ подключения Tailwind v4 через `@tailwindcss/postcss`. Используем как baseline, чтобы не заводить legacy-конфиг.
- [shadcn/ui Next.js installation](https://ui.shadcn.com/docs/installation/next): официальный init-flow, preflight checks и alias requirements. Используем, чтобы bootstrap был reproducible и совместимым с registry.
- [shadcn/ui CLI](https://ui.shadcn.com/docs/cli): актуальные команды `init`/`add` и доступные флаги. Используем для стандартизированного создания foundation/components вместо ручной генерации.

## Progress note (2026-03-05)
- Выполнен foundation bootstrap для FT-0081:
  - подключён Tailwind v4 в `apps/web`,
  - добавлен `components.json` и shadcn theming baseline,
  - добавлен первый registry-компонент `ui/button`.
- Завершена функциональная часть FT-0081:
  - добавлены экраны `auth/login`, `auth/callback`, `select-company`,
  - добавлены API route handlers для app-session (`/api/session/*`) и dev acceptance (`/api/dev/*`),
  - добавлены client/core/db изменения для `membership.list`,
  - добавлен Playwright acceptance `ft-0081-auth-company-switcher.spec.ts`.

## Quality checks evidence (2026-03-05)
- `pnpm --filter @feedback-360/api-contract lint && pnpm --filter @feedback-360/api-contract typecheck && pnpm --filter @feedback-360/api-contract test` → passed.
- `pnpm --filter @feedback-360/db lint && pnpm --filter @feedback-360/db typecheck` → passed.
- `pnpm --filter @feedback-360/client lint && pnpm --filter @feedback-360/client typecheck && pnpm --filter @feedback-360/client exec vitest run src/ft-0081-membership-list-client.test.ts` → passed.
- `pnpm --filter @feedback-360/core lint && pnpm --filter @feedback-360/core typecheck && set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0081-membership-list-no-db.test.ts src/ft/ft-0081-membership-list.test.ts --fileParallelism=false` → passed.
- `pnpm --filter @feedback-360/web lint && pnpm --filter @feedback-360/web typecheck && pnpm --filter @feedback-360/web test && pnpm --filter @feedback-360/web build` → passed (with known Sentry/OpenTelemetry warnings, build status = success).

## Acceptance evidence (2026-03-05)
- `cd apps/web && node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs` → passed (`smoke.spec.ts`, `ft-0081-auth-company-switcher.spec.ts`).
- Сценарий подтверждён: после dev-login пользователь переключает `active company` A→B, root page отражает выбранную компанию, и context остаётся tenant-scoped.
- Artifacts:
  - `.memory-bank/evidence/EP-008/FT-0081/2026-03-05/step-01-company-switcher-initial.png` — стартовый экран выбора компании, обе memberships видны.
  - `.memory-bank/evidence/EP-008/FT-0081/2026-03-05/step-02-active-company-a.png` — после выбора A главная страница показывает `Acme 360 A`.
  - `.memory-bank/evidence/EP-008/FT-0081/2026-03-05/step-03-company-switcher-before-b.png` — повторный вход в switcher перед переключением на B.
  - `.memory-bank/evidence/EP-008/FT-0081/2026-03-05/step-04-active-company-b.png` — после выбора B главная страница показывает `Acme 360 B`.

## Manual verification (deployed environment)
### Beta quick smoke (dev-helper path)
- Environment:
  - URL: `https://beta.go360go.ru`
  - Date: `2026-03-05`
- Preconditions:
  - `APP_ENV != prod` (dev endpoints `/api/dev/*` доступны).
- Steps:
  1) Открыть `https://beta.go360go.ru/auth/login`.
  2) Нажать `Войти в demo-режиме`.
  3) На `select-company` выбрать `Acme 360 A`.
  4) На `/` проверить блок “Текущая компания”.
  5) Нажать `Сменить компанию`, выбрать `Acme 360 B`.
- Expected:
  - после шага 2 открывается `select-company`;
  - после шага 3 на `/` отображается `Acme 360 A`;
  - после шага 5 на `/` отображается `Acme 360 B`.

### Beta real magic-link path
- Preconditions:
  - email пользователя заранее создан в Supabase Auth (signups выключены);
  - для `auth.user.id` есть `company_memberships` (и, по бизнес-контракту, связанный employee).
- Steps:
  1) На `https://beta.go360go.ru/auth/login` ввести email и отправить magic link.
  2) Открыть ссылку из письма.
  3) На `select-company` выбрать компанию и проверить `/`.
- Expected:
  - вход завершён через callback;
  - если memberships > 1, доступен выбор компании;
  - если memberships отсутствуют, показывается ошибка загрузки компаний (корректный fail-safe).
