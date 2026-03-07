# FT-0212 — Test ID and POM normalization
Status: Completed (2026-03-07)

## User value
Automation становится устойчивее: Playwright/XE используют predictable selectors, а UI можно рефакторить без массовых flaky падений.

## Deliverables
- `data-testid` normalization on highest-value screens.
- Updated POM mapping with `screen_id` and `testIdScope`.
- Stable root/toolbar/primary-action/status selectors for critical screens.

## Context (SSoT links)
- [Screen registry](../../../../../spec/ui/screen-registry.md): source of `screen_id` and `testIdScope`. Читать, чтобы selectors строились от канонического scope.
- [Test ID registry](../../../../../spec/ui/test-id-registry.md): naming contract для stable selectors. Читать, чтобы normalization не плодил новые стили имен.
- [Design system sync policy](../../../../../spec/ui/design-system/sync-policy.md): обязательные sync points для UI changes and screenshots. Читать, чтобы selector rollout шёл вместе с docs/screens updates.
- [POM conventions](../../../../../spec/ui/pom/conventions.md): how POM refers to screen spec and test ids. Читать, чтобы UI automation оставалась composable.
- [UI automation contract](../../../../../spec/testing/ui-automation-contract.md): role of screen specs, POM and `data-testid` in XE. Читать, чтобы acceptance/XE flows не сломались.

## Project grounding
- Проверить current Playwright tests and XE browser flows.
- Выбрать highest-value screens:
  - app shell,
  - HR campaigns list/detail,
  - employee directory,
  - org,
  - questionnaire inbox/fill,
  - results surfaces.
- Зафиксировать current flaky or ad-hoc selectors.

## Implementation plan
- Ввести root scope selectors на key screens.
- Нормализовать critical action selectors.
- Обновить POM docs and, where needed, Playwright selectors/tests.
- Прогнать targeted UI acceptance on local and beta.

## Scenarios (auto acceptance)
### Setup
- Use current beta/local seeded data for existing UI tests.

### Action
1. Run targeted Playwright tests for employees/org/campaigns/questionnaires/results.
2. Verify selectors are using normalized test ids for primary interactions.

### Assert
- Critical tests pass without CSS/text-only selector dependence on major actions.
- XE/browser smoke still reaches the same surfaces after selector changes.

### Client API ops (v1)
- N/A directly; UI automation slice.

## Manual verification (deployed environment)
- Beta:
  - open app shell;
  - navigate to employees/org/campaigns/questionnaires/results;
  - confirm unchanged behavior and stable primary actions.

## Tests
- Playwright targeted suites for touched screens.
- Docs audit if POM/docs changed.

## Docs updates (SSoT)
- `spec/ui/pom/*`
- `spec/testing/ui-automation-contract.md`
- relevant screen specs

## Quality checks evidence (2026-03-07)
- `pnpm checks` → passed
- `pnpm docs:audit` → passed
- `cd apps/web && PLAYWRIGHT_BASE_URL=http://127.0.0.1:3108 node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0212-testid-normalization.spec.ts --workers=1 --reporter=line` → passed
- `cd apps/web && PLAYWRIGHT_BASE_URL=https://beta.go360go.ru node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0212-testid-normalization.spec.ts --workers=1 --reporter=line` → passed

## Acceptance evidence (2026-03-07)
- Critical routes expose normalized roots and primary scopes:
  - `scr-hr-employees-root`
  - `scr-hr-org-root`
  - `scr-questionnaires-inbox-root`
  - `scr-results-hr-root`
- Playwright proof captured at `.memory-bank/evidence/EP-021/FT-0212/2026-03-07/step-01-normalized-selectors__(SCR-RESULTS-HR).png`
- Existing shell/questionnaire/results acceptance suites still navigate through normalized ids without changing domain behavior
