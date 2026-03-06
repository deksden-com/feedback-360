# FT-0171 — Reminder schedule editor
Status: Planned (2026-03-06)

## User value
HR настраивает reminders в UI и видит, когда система реально отправит сообщения.

## Deliverables
- Schedule editor.
- Timezone-aware next-run preview.
- Quiet hours and override hints.

## Context (SSoT links)
- [Notifications](../../../../../spec/notifications/notifications.md): reminder events and trigger semantics. Читать, чтобы editor corresponded to actual send model.
- [Outbox and retries](../../../../../spec/notifications/outbox-and-retries.md): scheduler/output behavior. Читать, чтобы preview and diagnostics matched reality.
- [Stitch mapping — EP-017](../../../../../spec/ui/design-references-stitch.md#ep-017--notification-center-ui): no direct mock, use only generic admin patterns.

## Project grounding
- Проверить current reminder config model and CLI flows.
- Свериться with company/campaign timezone rules.

## Implementation plan
- Add schedule form with preview.
- Explain timezone inheritance and overrides.
- Validate impossible or noisy configurations.

## Scenarios (auto acceptance)
### Setup
- Seed: `S5_campaign_started_no_answers`, `S6_campaign_started_some_drafts`.

### Action
1. Open reminder settings.
2. Change cadence/time.
3. Check preview.

### Assert
- Preview honors timezone and quiet hours.
- Invalid configurations blocked.

### Client API ops (v1)
- Reminder schedule get/update/preview ops.

## Manual verification (deployed environment)
- `beta`: edit reminder settings and confirm next-run preview updates correctly.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
