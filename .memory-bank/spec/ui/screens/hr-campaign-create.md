---
description: HR campaign create screen contract for creating a new draft campaign.
purpose: Read before changing campaign creation UX or draft campaign setup flows.
status: Active
date: 2026-03-09
screen_id: SCR-HR-CAMPAIGN-CREATE
route: /hr/campaigns/new
actors:
  - hr_admin
test_id_scope: scr-hr-campaign-create
implementation_files:
  - apps/web/src/app/hr/campaigns/new/page.tsx
test_files:
  - apps/web/playwright/tests/ft-0122-campaign-draft-config.spec.ts
---

# Screen spec — HR campaign create
Status: Active (2026-03-09)

## Purpose
Создание новой кампании в статусе `draft`.

## Information blocks
- campaign name and schedule inputs;
- model selection;
- draft settings, reminders, anonymity/small-group policy hints;
- next-step path toward participants/matrix/detail.

## Primary actions
- create draft campaign;
- continue to detail/edit workflow.

## Secondary actions
- cancel back to campaign catalog.

## States
- blank create form;
- validation errors;
- successful create redirect;
- admin-only access.

## Domain-specific behavior
- campaign starts in `draft`;
- model and participant composition remain editable until freeze rules apply;
- company timezone/reminder defaults are inherited here.

## Implementation entrypoints
- `apps/web/src/app/hr/campaigns/new/page.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0122-campaign-draft-config.spec.ts`
