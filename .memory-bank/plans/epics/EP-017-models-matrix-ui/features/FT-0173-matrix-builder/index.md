# FT-0173 — Matrix builder with freeze preview
Status: Planned (2026-03-06)

## User value
HR настраивает “кто кого оценивает” в понятном UI и заранее понимает, что произойдёт после lock.

## Deliverables
- Matrix builder UI.
- Autogenerate preview from org structure.
- Manual overrides and freeze warning banner.

## Context (SSoT links)
- [Assignments and matrix](../../../../../spec/domain/assignments-and-matrix.md): assignment groups and manual/autogen rules. Читать, чтобы builder соответствовал доменной модели.
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): first draft-save lock semantics. Читать, чтобы preview and lock states были точными.
- [Stitch mapping — EP-017](../../../../../spec/ui/design-references-stitch.md#ep-017--competency-models-and-matrix-ui): people/tree patterns and action clusters.

## Project grounding
- Прочитать EP-003 autogen rules and FT-0084 current workbench.
- Проверить seeded org snapshot and lock scenarios.

## Implementation plan
- Add assignment preview grouped by role.
- Support autogen and manual edits before lock.
- Surface lock warning before and after first draft save.

## Scenarios (auto acceptance)
### Setup
- Seed: `S4_campaign_draft`, `S2_org_basic`, `S6_campaign_started_some_drafts`.

### Action
1. Generate matrix from org/departments.
2. Adjust peer assignments.
3. Reopen after first draft-save.

### Assert
- Preview matches org snapshot.
- Edits work before lock.
- After lock matrix becomes read-only with explanation.

### Client API ops (v1)
- Matrix generate/update/list and campaign lock state.

## Manual verification (deployed environment)
- `beta`: generate assignments, edit them, then verify lock after first questionnaire draft is saved.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
