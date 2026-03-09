---
description: Quick reference for checking notification flow, outbox issues, and reminder-related troubleshooting.
purpose: Read when you need a short operator checklist for notification problems without opening the full notification spec and runbook.
status: Active
date: 2026-03-09
parent: .memory-bank/guides/reference/index.md
screen_ids:
  - SCR-HR-NOTIFICATIONS
---

# Notification troubleshooting — quick reference
Status: Active (2026-03-09)

## First checks
- confirm the campaign is in a state where notifications should exist;
- verify reminder settings on the HR notifications surface;
- check whether outbox entries were created and what status they have.

## Typical questions
- “No invite was sent” → verify campaign start and participant inclusion.
- “Reminder not sent today” → verify timezone, weekdays, and quiet hours.
- “Message failed” → inspect attempts, retry state, and provider-specific error.

## Where to look
- HR notification center in UI for reminders, template preview, and delivery diagnostics
- outbox/delivery diagnostics data in the notifications subsystem
- XE/test adapter outputs when reproducing in local or beta

## Related specs
- [Notifications](../../spec/notifications/notifications.md) — normative event, outbox, and scheduling rules.
- [HR notifications screen](../../spec/ui/screens/hr-notifications.md) — UI contract for reminder and delivery diagnostics.
- [Runbook](../../spec/operations/runbook.md) — operational investigation steps and release checks.
