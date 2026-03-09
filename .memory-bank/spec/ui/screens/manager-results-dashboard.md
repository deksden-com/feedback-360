---
description: Manager results dashboard screen contract for team-safe result viewing.
purpose: Read before changing manager results UX or anonymity-aware team result flows.
status: Active
date: 2026-03-09
screen_id: SCR-RESULTS-MANAGER
route: /results/team
actors:
  - manager
test_id_scope: scr-results-manager
implementation_files:
  - apps/web/src/app/results/team/page.tsx
  - apps/web/src/features/results/components/results-shared.tsx
test_files:
  - apps/web/playwright/tests/ft-0152-manager-results-dashboard.spec.ts
  - apps/web/playwright/tests/ft-0215-content-first-surfaces.spec.ts
---

# Screen spec — Manager results dashboard
Status: Active (2026-03-09)

## Purpose
Manager-facing team/results dashboard.

## Information blocks
- summary hero для выбранного сотрудника/команды;
- role-safe group cards и competency blocks;
- visibility notes по anonymity/hidden groups;
- navigation between available team members.

## Primary actions
- switch selected team member;
- inspect available results.

## Secondary actions
- review visibility explanations for hidden/merged groups.

## States
- employee selected with visible team data;
- hidden/merged group explanation;
- no available team results yet.

## Domain-specific behavior
- manager sees only role-appropriate aggregates;
- manager group is never anonymized in downstream results, but other groups still follow threshold policy.

## Implementation entrypoints
- `apps/web/src/app/results/team/page.tsx`
- `apps/web/src/features/results/components/results-shared.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0152-manager-results-dashboard.spec.ts`
- `apps/web/playwright/tests/ft-0215-content-first-surfaces.spec.ts`
