# FT-0192 — AI jobs and webhook diagnostics
Status: Planned (2026-03-06)

## User value
HR Admin/ops быстро понимают, что происходит с AI jobs и почему campaign в `processing_ai` или `ai_failed`.

## Deliverables
- AI jobs table.
- Webhook receipt drill-down.
- Idempotency/retry markers and campaign linkbacks.

## Context (SSoT links)
- [AI processing](../../../../../spec/ai/ai-processing.md): job lifecycle. Читать, чтобы statuses and actions matched campaign behavior.
- [Webhook security](../../../../../spec/security/webhooks-ai.md): idempotency and retry semantics. Читать, чтобы diagnostics correctly explained receipts.
- [Stitch mapping — EP-019](../../../../../spec/ui/design-references-stitch.md#ep-019--admin-and-ops-ui): generic operational table patterns.

## Project grounding
- Проверить current AI stub/job data and webhook receipts.
- Свериться with HR/Admin visibility boundaries.

## Implementation plan
- Add AI diagnostics page or module inside ops.
- Surface job status timeline and receipt info.
- Highlight no-op duplicate receipts separately.

## Scenarios (auto acceptance)
### Setup
- Seed: `S9_campaign_completed_with_ai`, `ai_failed` variant, webhook receipt fixtures.

### Action
1. Open AI diagnostics.
2. Filter by campaign/status.
3. Expand receipts.

### Assert
- Job and campaign statuses consistent.
- Duplicate receipt labeled as idempotent no-op.
- Failed reasons visible.

### Client API ops (v1)
- AI jobs and webhook diagnostics read ops.

## Manual verification (deployed environment)
- `beta`: compare one completed and one failed AI campaign in diagnostics.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
