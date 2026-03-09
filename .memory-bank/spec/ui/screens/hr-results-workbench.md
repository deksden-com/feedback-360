---
description: HR results workbench screen contract for HR-facing results review and visibility controls.
purpose: Read before changing HR results UX, raw/processed text visibility, or subject switching flows.
status: Active
date: 2026-03-09
screen_id: SCR-RESULTS-HR
route: /results/hr
actors:
  - hr_admin
  - hr_reader
test_id_scope: scr-results-hr
implementation_files:
  - apps/web/src/app/results/hr/page.tsx
  - apps/web/src/features/results/components/results-shared.tsx
test_files:
  - apps/web/playwright/tests/ft-0153-hr-results-workbench.spec.ts
  - apps/web/playwright/tests/ft-0101-results-privacy.spec.ts
  - apps/web/playwright/tests/ft-0215-content-first-surfaces.spec.ts
---

# Screen spec — HR results workbench
Status: Active (2026-03-09)

## Purpose
HR-facing workbench результатов кампаний.

## Information blocks
- summary hero/results overview;
- rich group and competency sections;
- processed insights and, where policy allows, raw/original comment visibility;
- filters/switchers по subject/campaign.

## Primary actions
- inspect full results across subjects/campaigns;
- switch subject/campaign context.

## Secondary actions
- compare processed and raw text where policy allows;
- inspect visibility-limiting notes.

## States
- `hr_admin` with full visibility;
- `hr_reader` without raw-only/destructive actions;
- completed vs in-progress results availability.

## Domain-specific behavior
- `hr_admin` can see original comments;
- `hr_reader` remains restricted from raw-only/destructive capabilities;
- anonymity and group hiding rules still apply to non-manager groups even in HR views, but HR visibility is richer than employee/manager views.

## Implementation entrypoints
- `apps/web/src/app/results/hr/page.tsx`
- `apps/web/src/features/results/components/results-shared.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0153-hr-results-workbench.spec.ts`
- `apps/web/playwright/tests/ft-0101-results-privacy.spec.ts`
- `apps/web/playwright/tests/ft-0215-content-first-surfaces.spec.ts`
