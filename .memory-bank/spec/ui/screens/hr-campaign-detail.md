---
description: HR campaign detail screen contract for campaign operations, status, and related actions.
purpose: Read before changing campaign detail UX, lifecycle operations, or progress visibility.
status: Active
date: 2026-03-09
screen_id: SCR-HR-CAMPAIGN-DETAIL
route: /hr/campaigns/[campaignId]
actors:
  - hr_admin
  - hr_reader
test_id_scope: scr-hr-campaign-detail
implementation_files:
  - apps/web/src/app/hr/campaigns/[campaignId]/page.tsx
test_files:
  - apps/web/playwright/tests/ft-0123-campaign-detail-dashboard.spec.ts
---

# Screen spec — HR campaign detail
Status: Active (2026-03-09)

## Purpose
Operational detail кампании.

## Information blocks
- summary hero со статусом, сроками, progress, lock и AI state;
- operational sections: participants, assignments/matrix, reminders, results entry points;
- secondary diagnostics/actions.

## Primary actions
- start/stop/end/retry AI where allowed;
- inspect progress and move into matrix/results flows.

## Secondary actions
- review lock reasons;
- open related campaign edit/matrix/results surfaces.

## States
- draft campaign;
- started campaign;
- ended/processing/completed campaign;
- locked-after-first-draft-save note;
- read-only role (`hr_reader`) without destructive actions.

## Domain-specific behavior
- first questionnaire draft save locks matrix/weights campaign-wide;
- after start, model and participant composition become immutable;
- after end, questionnaires are read-only and AI lifecycle governs later status transitions.

## Implementation entrypoints
- `apps/web/src/app/hr/campaigns/[campaignId]/page.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0123-campaign-detail-dashboard.spec.ts`
