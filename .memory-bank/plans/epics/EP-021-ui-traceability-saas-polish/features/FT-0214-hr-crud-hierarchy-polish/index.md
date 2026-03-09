---
description: FT-0214-hr-crud-hierarchy-polish feature plan and evidence entry for EP-021-ui-traceability-saas-polish.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-021-ui-traceability-saas-polish/index.md
epic: EP-021
feature: FT-0214
---


# FT-0214 — HR CRUD and hierarchy polish
Status: Completed (2026-03-07)

## User value
HR работает со справочником сотрудников и оргструктурой через привычные CRUD/hierarchy patterns: искать, открывать, редактировать и понимать структуру компании становится проще и быстрее.

## Deliverables
- Employee directory toolbar and row/card hierarchy closer to common SaaS CRUD.
- Employee detail screen with clearer summary/history layout.
- Org editor with stronger visible hierarchy and selected-node detail pane.

## Context (SSoT links)
- [Screen-by-screen redesign](../../../../../spec/ui/screen-by-screen-redesign.md): recommendations for employees and org screens. Читать, чтобы FT закрывал именно agreed UI debt.
- [UI design principles](../../../../../spec/ui/design-principles.md): CRUD and hierarchy patterns. Читать, чтобы polish был product-consistent.
- [Design system](../../../../../spec/ui/design-system/index.md): component rules, toolbar/list/detail patterns and sync policy. Читать, чтобы employees/org polish использовал единый visual language.
- [EP-016 People and org admin](../../../EP-016-people-org-admin/index.md): baseline delivered functionality. Читать, чтобы не потерять уже работающие admin flows.
- [Org snapshots and history](../../../../../spec/domain/soft-delete-and-history.md): history is important and must stay visible. Читать, чтобы visual changes не скрыли важную историчность.

## Project grounding
- Пройти manual tutorial steps for employees/org.
- Проверить current beta screens and current routes.
- Свериться with existing acceptance tests for FT-0161..FT-0163.

## Implementation plan
- `Employees`:
  - improve toolbar hierarchy;
  - emphasize person identity, position, department, status;
  - make list rows/cards easier to scan.
- `Employee detail`:
  - promote summary block;
  - separate history/provisioning as secondary sections.
- `Org`:
  - strengthen tree indentation and selected department context;
  - use a two-panel layout where left is tree, right is current node detail.

## Scenarios (auto acceptance)
### Setup
- Existing people/org seeds and beta demo workspace.

### Action
1. Open employee directory and filter/search.
2. Open employee profile.
3. Open org editor and switch between departments.

### Assert
- Primary HR tasks remain unchanged.
- List and hierarchy are easier to parse but functionality is preserved.
- Manager/department relationships remain visible.

### Client API ops (v1)
- existing people/org operations only.

## Manual verification (deployed environment)
- Beta walkthrough:
  - employees list
  - employee profile
  - org tree
  - selected department details

## Tests
- Existing FT-0161..FT-0163 Playwright suites.
- Screenshot-based evidence update in tutorial and/or feature evidence.

## Docs updates (SSoT)
- `spec/ui/screen-by-screen-redesign.md`
- guides/tutorial screenshots for employees/org
- relevant future screen specs when added

## Quality checks evidence (2026-03-07)
- `pnpm checks` → passed
- `pnpm docs:audit` → passed
- `cd apps/web && PLAYWRIGHT_BASE_URL=http://127.0.0.1:3108 node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0214-hr-crud-hierarchy-polish.spec.ts --workers=1 --reporter=line` → passed
- `cd apps/web && PLAYWRIGHT_BASE_URL=https://beta.go360go.ru node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0214-hr-crud-hierarchy-polish.spec.ts --workers=1 --reporter=line` → passed

## Acceptance evidence (2026-03-07)
- Employee directory uses content-first SaaS CRUD hierarchy with clear toolbar, status badges and deep-link actions
- Employee detail promotes summary/history split instead of equal-weight operational blocks
- Org editor shows stronger tree + selected-node detail relationship
- Artifacts:
  - `.memory-bank/evidence/EP-021/FT-0214/2026-03-07/step-01-directory__(SCR-HR-EMPLOYEES).png`
  - `.memory-bank/evidence/EP-021/FT-0214/2026-03-07/step-02-profile__(SCR-HR-EMPLOYEE-DETAIL).png`
  - `.memory-bank/evidence/EP-021/FT-0214/2026-03-07/step-03-org__(SCR-HR-ORG).png`
