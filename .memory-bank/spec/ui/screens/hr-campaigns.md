---
description: HR campaigns screen contract for the campaign portfolio list and overview surface.
purpose: Read before changing campaign list UX, status summaries, or HR operational navigation.
status: Active
date: 2026-03-09
screen_id: SCR-HR-CAMPAIGNS
route: /hr/campaigns
actors:
  - hr_admin
  - hr_reader
test_id_scope: scr-hr-campaigns
implementation_files:
  - apps/web/src/app/hr/campaigns/page.tsx
test_files:
  - apps/web/playwright/tests/ft-0121-campaign-list.spec.ts
  - apps/web/playwright/tests/ft-0214-hr-crud-hierarchy-polish.spec.ts
---

# Screen spec — HR campaigns
Status: Active (2026-03-09)

## Purpose
Список и portfolio overview кампаний HR.

## Information blocks
- page header и summary counters по статусам;
- filters/search;
- main campaign list/cards;
- primary CTA создания кампании;
- links to campaign detail/results actions.

## Primary actions
- filter/search campaigns;
- open campaign detail;
- create campaign (`hr_admin`).

## Secondary actions
- inspect status mix and operational summaries across campaigns.

## States
- mixed statuses list;
- empty company without campaigns;
- filters narrowing campaign set;
- read-only role (`hr_reader`) without create/edit actions.

## Domain-specific behavior
- status semantics must stay aligned with campaign lifecycle (`draft`, `started`, `ended`, `processing_ai`, `ai_failed`, `completed`);
- summary counters are operational, not a replacement for detail/status rules.

## Implementation entrypoints
- `apps/web/src/app/hr/campaigns/page.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0121-campaign-list.spec.ts`
- `apps/web/playwright/tests/ft-0214-hr-crud-hierarchy-polish.spec.ts`
