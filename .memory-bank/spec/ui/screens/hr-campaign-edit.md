---
description: HR campaign edit screen contract for mutable campaign settings before freeze restrictions apply.
purpose: Read before changing campaign edit UX or draft/locked field behavior.
status: Active
date: 2026-03-09
screen_id: SCR-HR-CAMPAIGN-EDIT
route: /hr/campaigns/[campaignId]/edit
actors:
  - hr_admin
test_id_scope: scr-hr-campaign-edit
implementation_files:
  - apps/web/src/app/hr/campaigns/[campaignId]/edit/page.tsx
test_files:
  - apps/web/playwright/tests/ft-0122-campaign-draft-config.spec.ts
---

# Screen spec — HR campaign edit
Status: Active (2026-03-09)

## Purpose
Редактирование draft-кампании и mutable campaign settings до наступления freeze restrictions.

## Information blocks
- draft campaign fields and schedule;
- model link and draft-only configuration;
- weights/reminder settings where editable;
- lock/freeze notes if campaign is already constrained.

## Primary actions
- save draft changes;
- navigate to detail or matrix workflow.

## Secondary actions
- cancel changes;
- open related campaign detail.

## States
- editable draft;
- partially locked campaign after first draft save;
- non-editable post-start/read-only state.

## Domain-specific behavior
- after `started`, model and participant composition are no longer mutable;
- after first questionnaire draft save, matrix/weights become locked at campaign level.

## Implementation entrypoints
- `apps/web/src/app/hr/campaigns/[campaignId]/edit/page.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0122-campaign-draft-config.spec.ts`
