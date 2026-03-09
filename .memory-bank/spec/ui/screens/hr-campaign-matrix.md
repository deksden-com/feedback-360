---
description: HR campaign matrix screen contract for assignment matrix review and editing.
purpose: Read before changing matrix builder UX, lock messaging, or assignment-group interactions.
status: Active
date: 2026-03-09
screen_id: SCR-HR-CAMPAIGN-MATRIX
route: /hr/campaigns/[campaignId]/matrix
actors:
  - hr_admin
  - hr_reader
test_id_scope: scr-hr-campaign-matrix
implementation_files:
  - apps/web/src/app/hr/campaigns/[campaignId]/matrix/page.tsx
test_files:
  - apps/web/playwright/tests/ft-0173-matrix-builder.spec.ts
---

# Screen spec — HR campaign matrix
Status: Active (2026-03-09)

## Purpose
Просмотр и настройка матрицы “кто кого оценивает” для кампании.

## Information blocks
- selected campaign/subject context;
- suggested and manual rater groups;
- freeze/lock explanation;
- group counts and coverage hints.

## Primary actions
- review generated assignments;
- add/remove assignments when still allowed.

## Secondary actions
- navigate back to campaign detail;
- inspect lock reason when matrix is frozen.

## States
- editable matrix before lock;
- read-only matrix after lock/start rules;
- empty or partially generated matrix.

## Domain-specific behavior
- matrix is campaign-scoped;
- first questionnaire draft save locks matrix changes for the whole campaign;
- one rater may appear in different roles across different subjects.

## Implementation entrypoints
- `apps/web/src/app/hr/campaigns/[campaignId]/matrix/page.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0173-matrix-builder.spec.ts`
