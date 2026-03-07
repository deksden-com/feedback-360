# FT-0213 — App shell and identity chrome
Status: Completed (2026-03-07)

## User value
Пользователь лучше понимает, **кто он**, **в какой компании работает** и **какой аккаунт/роль сейчас активны**. Приложение ощущается как привычный SaaS workspace, а не набор внутренних страниц.

## Deliverables
- Top-right user menu with avatar/initials, user identity, active role and active company.
- Sidebar regrouping by product areas.
- Less prominent diagnostic-only metadata (`Company ID`).
- Improved page header hierarchy with clearer title/subtitle/primary action composition.

## Context (SSoT links)
- [UI design principles](../../../../../spec/ui/design-principles.md): familiar SaaS shell, user menu, content-first header. Читать, чтобы shell polish шёл по уже принятой модели.
- [Design system](../../../../../spec/ui/design-system/index.md): tokens, component rules and sync policy for repeated visual patterns. Читать, чтобы shell redesign сразу ложился в общий visual language.
- [Screen-by-screen redesign](../../../../../spec/ui/screen-by-screen-redesign.md): current shell issues and proposed fixes. Читать, чтобы FT закрывал именно выявленные проблемы.
- [Internal home screen spec](../../../../../spec/ui/screens/internal-home.md): current role-aware home contract. Читать, чтобы visual polish не менял purpose/actions.

## Project grounding
- Проверить live shell на beta.
- Свериться с current routes and nav groups per role.
- Подготовить список identity fields, которые уже доступны в shell meta.

## Implementation plan
- Перестроить `InternalAppShell`:
  - top bar with user menu;
  - clearer current company and role display;
  - grouped sidebar sections;
  - reduced prominence for technical metadata.
- Update home page cards/header composition if needed.
- Re-run shell/home acceptance and beta smoke.

## Scenarios (auto acceptance)
### Setup
- Existing demo/beta HR account and role-aware home data.

### Action
1. Open internal shell as HR and as non-HR role.
2. Use account menu.
3. Switch company or sign out.

### Assert
- User identity is visible in shell chrome.
- Active company and role are obvious without opening details.
- Core navigation still works for all relevant roles.

### Client API ops (v1)
- no new client ops expected; visual/IA refactor over existing context loading.

## Manual verification (deployed environment)
- Beta:
  1. login;
  2. inspect shell;
  3. navigate through grouped nav;
  4. open account menu;
  5. switch company/sign out.

## Tests
- Existing shell/home Playwright suites.
- New Playwright checks for account menu and grouped nav if required.

## Docs updates (SSoT)
- `spec/ui/design-principles.md`
- `spec/ui/screens/internal-home.md`
- tutorial screenshots if shell visibly changed

## Quality checks evidence (2026-03-07)
- `pnpm checks` → passed
- `pnpm docs:audit` → passed
- `cd apps/web && PLAYWRIGHT_BASE_URL=http://127.0.0.1:3108 node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0111-app-shell.spec.ts tests/ft-0213-shell-identity-chrome.spec.ts --workers=1 --reporter=line` → passed
- `cd apps/web && PLAYWRIGHT_BASE_URL=https://beta.go360go.ru node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0111-app-shell.spec.ts tests/ft-0213-shell-identity-chrome.spec.ts --workers=1 --reporter=line` → passed

## Acceptance evidence (2026-03-07)
- Shell now exposes familiar SaaS identity chrome:
  - company card in sidebar
  - grouped nav sections
  - avatar/initials and account summary in header
  - sign-out in account menu
- Updated shell proof captured at `.memory-bank/evidence/EP-021/FT-0213/2026-03-07/step-01-shell-account-menu__(SCR-APP-HOME).png`
- Cross-check with shared shell regression also passes on beta through `ft-0111-app-shell.spec.ts`
