---
description: Employee results dashboard screen contract for private self-service results viewing.
purpose: Read before changing employee results UX, visibility behavior, or related automation.
status: Active
date: 2026-03-09
screen_id: SCR-RESULTS-EMPLOYEE
route: /results
actors:
  - employee
test_id_scope: scr-results-employee
implementation_files:
  - apps/web/src/app/results/page.tsx
  - apps/web/src/features/results/components/results-shared.tsx
test_files:
  - apps/web/playwright/tests/ft-0151-employee-results-dashboard.spec.ts
  - apps/web/playwright/tests/ft-0101-results-privacy.spec.ts
  - apps/web/playwright/tests/ft-0215-content-first-surfaces.spec.ts
---

# Screen spec — Employee results dashboard
Status: Active (2026-03-09)

## Purpose
Employee-facing dashboard результатов 360.

## Information blocks
- summary hero;
- visibility-safe group cards;
- competency insight blocks;
- processed/summary text insights.

## Primary actions
- inspect own results by competency and group.

## Secondary actions
- switch campaign/subject where current UX allows;
- read methodology/visibility notes.

## States
- completed results available;
- hidden/merged groups due to anonymity;
- no results yet.

## Domain-specific behavior
- employee sees only safe aggregate content;
- original/raw comments are not shown;
- self data is visualized but does not affect weighted final score.

## Implementation entrypoints
- `apps/web/src/app/results/page.tsx`
- `apps/web/src/features/results/components/results-shared.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0151-employee-results-dashboard.spec.ts`
- `apps/web/playwright/tests/ft-0101-results-privacy.spec.ts`
- `apps/web/playwright/tests/ft-0215-content-first-surfaces.spec.ts`
