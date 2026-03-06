# FT-0183 — Audit trail and release console
Status: Planned (2026-03-06)

## User value
Команда может проследить, кто и когда менял кампанию, матрицу, уведомления или запускал AI retry.

## Deliverables
- Audit events table with filters.
- Release event panel.
- Deep links to affected campaign/user objects.

## Context (SSoT links)
- [RBAC](../../../../../spec/security/rbac.md): кто должен видеть audit/ops data. Читать, чтобы diagnostics не раскрывали лишнее.
- [Runbook](../../../../../spec/operations/runbook.md): release/recovery steps and terminology. Читать, чтобы release console использовал те же operational concepts.
- [Stitch mapping — EP-018](../../../../../spec/ui/design-references-stitch.md#ep-018--admin-and-ops-ui): generic diagnostics tables/cards.

## Project grounding
- Проверить current audit signals/evidence sources.
- Свериться with release traceability standards and git/deploy docs.

## Implementation plan
- Build searchable audit console.
- Add actor/action/campaign/date filters.
- Surface release events next to business audit events without mixing permissions.

## Scenarios (auto acceptance)
### Setup
- Seed: audit fixtures around campaign start, matrix change, reminder dispatch, AI retry.

### Action
1. Open audit console.
2. Filter by campaign and actor.
3. Open a release event.

### Assert
- Event order deterministic.
- Metadata sufficient to reconstruct who/what/when.
- Restricted fields redacted by role.

### Client API ops (v1)
- Audit/release diagnostics read ops.

## Manual verification (deployed environment)
- `beta`: find events for one known campaign lifecycle and compare with actual UI actions/runbook evidence.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
