---
description: HR notifications screen contract for reminders, templates, and delivery diagnostics.
purpose: Read before changing notification center UX or delivery/reminder operator flows.
status: Active
date: 2026-03-09
screen_id: SCR-HR-NOTIFICATIONS
route: /hr/notifications
actors:
  - hr_admin
  - hr_reader
test_id_scope: scr-hr-notifications
implementation_files:
  - apps/web/src/app/hr/notifications/page.tsx
test_files:
  - apps/web/playwright/tests/ft-0181-reminder-schedule-editor.spec.ts
  - apps/web/playwright/tests/ft-0182-template-catalog.spec.ts
  - apps/web/playwright/tests/ft-0183-delivery-diagnostics.spec.ts
---

# Screen spec — HR notifications
Status: Active (2026-03-09)

## Purpose
UI surface for reminder schedules, templates and delivery diagnostics.

## Information blocks
- reminder schedule editor;
- template catalog/preview;
- delivery/outbox diagnostics;
- channel and environment notes.

## Primary actions
- update reminder schedule;
- preview templates;
- inspect delivery attempts and statuses.

## Secondary actions
- retry/navigation actions where allowed by role and current design.

## States
- schedule configured;
- empty diagnostics;
- failed delivery diagnostics;
- read-only `hr_reader` mode for non-destructive actions.

## Domain-specific behavior
- MVP delivery channel is email-first;
- idempotency/outbox state should be visible without exposing provider internals excessively;
- telegram is placeholder/post-MVP, not an active delivery path.

## Implementation entrypoints
- `apps/web/src/app/hr/notifications/page.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0181-reminder-schedule-editor.spec.ts`
- `apps/web/playwright/tests/ft-0182-template-catalog.spec.ts`
- `apps/web/playwright/tests/ft-0183-delivery-diagnostics.spec.ts`
