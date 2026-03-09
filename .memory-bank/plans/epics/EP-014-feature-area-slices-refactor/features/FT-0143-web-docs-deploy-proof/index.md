---
description: FT-0143-web-docs-deploy-proof feature plan and evidence entry for EP-014-feature-area-slices-refactor.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-014-feature-area-slices-refactor/index.md
epic: EP-014
feature: FT-0143
---


# FT-0143 — Web/lib realignment, docs sync and deployment proof
Status: Completed (2026-03-06)

## Traceability (mandatory)
- Epic: [EP-014 — Feature-area slice refactor](../../index.md)
- PR: должен ссылаться на этот FT-документ и на execution evidence в [Verification matrix](../../../../verification-matrix.md).
- Commits/branch: следовать `[FT-0143]` / `[EP-014]` и правилам из [Git flow](../../../../../spec/operations/git-flow.md).

## User value
После refactor команда продолжает безопасно развивать web UI и planned GUI epics, потому что routes, page libs, documentation и beta deployment остаются согласованными и рабочими.

## Deliverables
- `apps/web` и связанные `lib/` модули выровнены под feature areas и shared UI primitives.
- Planned GUI epics/results references rebased на новую numbering and structure model.
- Memory Bank ссылки, route mapping, visual-reference mapping и verification matrix синхронизированы с новой архитектурой.
- Есть end-to-end regression proof на локальном окружении и `beta`.

## Context (SSoT links)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md): текущие и будущие surfaces. Читать, чтобы не потерять route model после реорганизации.
- [UI design references mapping](../../../../../spec/ui/design-references-stitch.md): связь planned GUI work с visual refs. Читать, чтобы после renumbering не сломать карту будущих экранов.
- [Delivery standards](../../../../../spec/engineering/delivery-standards.md): evidence, quality gate, acceptance gate.
- [Verification matrix](../../../../verification-matrix.md): обязательные checks и execution evidence sections.
- [Runbook](../../../../../spec/operations/runbook.md): deploy/smoke expectations для beta.

## Project grounding (mandatory before coding)
- [ ] Прочитаны FT-0141 и FT-0142.
- [ ] Проверены current `apps/web` route groups, shared libs and page-state helpers.
- [ ] Сверены UI docs: sitemap, design refs, assets index, later epic docs.
- [ ] Составлен список user journeys, которые обязательно smoke-проверяем после refactor.

## Implementation plan
- Выровнять `apps/web` server/lib modules под feature areas там, где это улучшает ownership и уменьшает cross-route coupling.
- Оставить truly shared UI pieces в shared shell/components/state modules.
- Обновить Memory Bank:
  - roadmap and epic catalogs,
  - later GUI epics and FT numbering,
  - verification matrix,
  - UI/asset mappings,
  - cross-links and anchor references.
- Завершить refactor только после local + CI + beta proof.

## Scenarios (auto acceptance)
### Setup
- Local environment with seeded data for campaigns/questionnaires/results.
- Beta environment with stable smoke dataset.

### Action
1. Прогнать Playwright/browser smoke для уже существующих user journeys.
2. Проверить, что route helpers/lib imports и docs links используют новую structure model.
3. Задеплоить refactor на `beta` и повторить smoke.

### Assert
- Existing app routes работают без regressions.
- Planning/docs links не ведут на старые epic numbers, removed directories или stale anchors.
- Beta deployment проходит, а smoke по ключевым маршрутам зелёный.

### Client API ops (v1)
- Indirectly covers already implemented UI flows over:
  - `campaign.*`
  - `questionnaire.*`
  - `results.*`
  - `membership.list`
  - `ai.runForCampaign` where exposed in HR flows.

## Manual verification (deployed environment)
- Environment:
  - URL: `https://beta.go360go.ru`
  - Build/commit: `f96de679b6720017ec4c5bec36755111a9a5a163` / `https://go360go-beta-8obl8oe7c-deksdens-projects.vercel.app`
  - Date: `2026-03-06`
- Preconditions:
  - seeded company and users for `hr_admin`, `employee`, `manager`;
  - test data for questionnaire draft/submitted and completed results;
  - deployment status `Ready`.
- Steps (start → finish):
  1. Login via magic link and select company.
  2. As `hr_admin`, open campaigns list and one campaign detail page.
  3. As `employee`, open questionnaire inbox and one questionnaire page.
  4. As `employee`, open my results; as `manager`, open team results.
- Expected result per step:
  - `step-1`: auth flow and internal shell load normally.
  - `step-2`: HR pages render and actions/loaders work.
  - `step-3`: questionnaire flow remains intact after refactor.
  - `step-4`: results surfaces still obey current visibility behavior.
- Tooling:
  - browser-check via `$agent-browser`.
- Notes:
  - attach screenshots for shell, HR campaigns, questionnaire and results pages.

## Tests
- E2E / browser smoke for existing routes.
- Docs audit and stale-reference scan.
- Build verification for `apps/web`.

## Docs updates (SSoT)
- [Memory Bank index](../../../../../index.md)
- [Plans index](../../../../index.md)
- [Roadmap](../../../../roadmap.md)
- [Epics catalog](../../../../epics.md)
- [Epic plans index](../../../index.md)
- [Verification matrix](../../../../verification-matrix.md)
- [UI index](../../../../../spec/ui/index.md)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
- [UI design references mapping](../../../../../spec/ui/design-references-stitch.md)
- [UI assets index](../../../../../assets/ui/index.md)

## Quality checks evidence (after implementation)
- Date: `2026-03-06`
- Checks run:
  - `pnpm checks`
  - `pnpm docs:audit`
  - `cd apps/web && PLAYWRIGHT_BASE_URL=http://127.0.0.1:3102 node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0143-slice-refactor-regression.spec.ts --workers=1 --reporter=line`
  - `PLAYWRIGHT_BASE_URL=https://beta.go360go.ru pnpm --filter @feedback-360/web exec playwright test --config playwright/playwright.config.mjs tests/ft-0143-slice-refactor-regression.spec.ts --workers=1 --reporter=line`
- Result: passed.

## Acceptance evidence (after implementation)
- Date: `2026-03-06`
- Commands/tests run:
  - `pnpm docs:audit`
  - `node scripts/audit-memory-bank.mjs --ep EP-014`
  - `cd apps/web && PLAYWRIGHT_BASE_URL=http://127.0.0.1:3102 node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0143-slice-refactor-regression.spec.ts --workers=1 --reporter=line`
  - `PLAYWRIGHT_BASE_URL=https://beta.go360go.ru pnpm --filter @feedback-360/web exec playwright test --config playwright/playwright.config.mjs tests/ft-0143-slice-refactor-regression.spec.ts --workers=1 --reporter=line`
- Result: passed.
- Artifacts: `.memory-bank/evidence/EP-014/FT-0143/2026-03-06/step-01-hr-campaign-list.png`, `.memory-bank/evidence/EP-014/FT-0143/2026-03-06/step-02-hr-campaign-detail.png`, `.memory-bank/evidence/EP-014/FT-0143/2026-03-06/step-03-questionnaire-detail.png`, `.memory-bank/evidence/EP-014/FT-0143/2026-03-06/step-04-results-my-dashboard.png`, `.memory-bank/evidence/EP-014/FT-0143/2026-03-06/step-05-results-team-dashboard.png`.

## CI/CD evidence (mandatory for runtime/deploy/integration changes)
- GitHub:
  - `https://github.com/deksden-com/feedback-360/actions/runs/22770711899`
  - `https://github.com/deksden-com/feedback-360/actions/runs/22770722046`
  - Status: passed
- Vercel:
  - `https://go360go-beta-8obl8oe7c-deksdens-projects.vercel.app`
  - Status: passed
