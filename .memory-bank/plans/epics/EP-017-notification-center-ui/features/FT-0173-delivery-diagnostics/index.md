# FT-0173 — Delivery diagnostics and outbox view
Status: Planned (2026-03-06)

## User value
HR/Admin видит, были ли отправлены письма, какие упали в retry/fail и почему.

## Deliverables
- Outbox/delivery table.
- Filters by campaign/status/channel.
- Attempt drill-down and retry state markers.

## Context (SSoT links)
- [Outbox and retries](../../../../../spec/notifications/outbox-and-retries.md): pending/retrying/sent/dead semantics. Читать, чтобы diagnostics labels были корректными.
- [Notifications](../../../../../spec/notifications/notifications.md): campaign event types and channels. Читать, чтобы filters matched the actual notification model.
- [Stitch mapping — EP-017](../../../../../spec/ui/design-references-stitch.md#ep-017--notification-center-ui): generic operational table patterns.

## Project grounding
- Проверить outbox tables and current CLI diagnostics.
- Свериться with permission model for HR/Admin readers.

## Implementation plan
- Add delivery diagnostics page with drill-down.
- Surface status badges and attempt history.
- Keep operations read-only unless explicit retry action later appears in spec.

## Scenarios (auto acceptance)
### Setup
- Seed: notification outbox data with sent/failed/retrying states.

### Action
1. Open diagnostics.
2. Filter by failed/retrying.
3. Expand a delivery item.

### Assert
- Statuses and attempts match outbox data.
- Campaign and recipient context visible.
- Retrying vs terminal failure distinguishable.

### Client API ops (v1)
- Notification diagnostics read ops.

## Manual verification (deployed environment)
- `beta`: inspect failed and retrying deliveries for a test campaign.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
