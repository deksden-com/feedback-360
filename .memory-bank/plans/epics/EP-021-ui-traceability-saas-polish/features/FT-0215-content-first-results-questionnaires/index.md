# FT-0215 — Content-first results and questionnaires
Status: Completed (2026-03-07)

## User value
Ключевые продуктовые surfaces показывают в первую очередь **содержимое работы** — прогресс, компетенции, результаты, выводы — а не вторичные controls. Это делает систему ближе к сильным review/feedback SaaS продуктам и снижает cognitive load.

## Deliverables
- Questionnaire inbox/fill with clearer progress/status hierarchy.
- Results dashboards with stronger summary-first layout.
- Better separation between primary content and secondary controls/diagnostics.

## Context (SSoT links)
- [UI design principles](../../../../../spec/ui/design-principles.md): questionnaire/results-specific rules. Читать, чтобы FT опирался на уже принятые product-level principles.
- [Design system](../../../../../spec/ui/design-system/index.md): tokens, report blocks, questionnaire section patterns and sync policy. Читать, чтобы content-first polish собирался в reusable visual system.
- [Screen-by-screen redesign](../../../../../spec/ui/screen-by-screen-redesign.md): specific proposals for questionnaire and results routes. Читать, чтобы changes were grounded in current UI audit.
- [EP-013 Questionnaire experience](../../../EP-013-questionnaire-experience/index.md): current questionnaire UX baseline. Читать, чтобы polish не ломал existing flow and acceptance.
- [EP-015 Results experience](../../../EP-015-results-experience/index.md): current results surfaces and privacy constraints. Читать, чтобы redesign preserved role-aware visibility.

## Project grounding
- Пройти current questionnaire/results screens on beta.
- Свериться с anonymity/visibility rules.
- Review current acceptance/evidence for questionnaires and results.

## Implementation plan
- `Questionnaires inbox`:
  - stronger pending/in-progress/submitted grouping;
  - clearer due date / target person hierarchy.
- `Questionnaire fill`:
  - sticky status/progress area;
  - one competency = one stable content block;
  - visually distinct save vs submit.
- `Results`:
  - summary hero first;
  - group sections clearer;
  - processed insights visibly separate from sensitive/raw content.

## Scenarios (auto acceptance)
### Setup
- Existing questionnaire/results seeds and beta scenario data.

### Action
1. Open questionnaire inbox and fill screen.
2. Save draft and submit.
3. Open employee/manager/HR results.

### Assert
- Content hierarchy is clearer while all prior actions remain available.
- Progress/status remain visible above the fold.
- Role visibility and anonymity behavior stay unchanged.

### Client API ops (v1)
- existing questionnaire/results operations only.

## Manual verification (deployed environment)
- Beta:
  - questionnaire inbox/fill flow,
  - employee results,
  - manager results,
  - HR results.

## Tests
- Existing questionnaire and results Playwright suites.
- Update screenshot evidence and tutorials if layout changes materially.

## Docs updates (SSoT)
- `spec/ui/design-principles.md`
- `spec/ui/screen-by-screen-redesign.md`
- results/questionnaire screen specs when introduced/expanded
- guides/tutorials with updated screenshots

## Quality checks evidence (2026-03-07)
- `pnpm checks` → passed
- `pnpm docs:audit` → passed
- `cd apps/web && PLAYWRIGHT_BASE_URL=http://127.0.0.1:3108 node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0215-content-first-surfaces.spec.ts --workers=1 --reporter=line` → passed
- `cd apps/web && PLAYWRIGHT_BASE_URL=https://beta.go360go.ru node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0215-content-first-surfaces.spec.ts --workers=1 --reporter=line` → passed

## Acceptance evidence (2026-03-07)
- Questionnaire inbox/fill now surface summary/progress/actions before secondary helpers
- Employee/manager/HR results now lead with report hero + summary block while preserving visibility/anonymity behavior
- Artifacts:
  - `.memory-bank/evidence/EP-021/FT-0215/2026-03-07/step-01-inbox__(SCR-QUESTIONNAIRES-INBOX).png`
  - `.memory-bank/evidence/EP-021/FT-0215/2026-03-07/step-02-fill__(SCR-QUESTIONNAIRES-FILL).png`
  - `.memory-bank/evidence/EP-021/FT-0215/2026-03-07/step-03-results-employee__(SCR-RESULTS-EMPLOYEE).png`
  - `.memory-bank/evidence/EP-021/FT-0215/2026-03-07/step-04-results-manager__(SCR-RESULTS-MANAGER).png`
  - `.memory-bank/evidence/EP-021/FT-0215/2026-03-07/step-05-results-hr__(SCR-RESULTS-HR).png`
