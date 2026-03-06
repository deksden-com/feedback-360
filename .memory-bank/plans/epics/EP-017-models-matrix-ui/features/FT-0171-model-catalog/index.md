# FT-0171 — Model catalog and version hub
Status: Planned (2026-03-06)

## User value
HR видит все competency models и версии в одном месте и понимает, какие из них можно использовать.

## Deliverables
- Models list.
- Version badges/statuses.
- Clone/create draft action.

## Context (SSoT links)
- [Competency models](../../../../../spec/domain/competency-models.md): versioned model structure and kinds. Читать, чтобы catalog показывал реальные сущности.
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): active campaign linkage matters for model usage hints. Читать, чтобы предупреждать про used versions.
- [Stitch mapping — EP-017](../../../../../spec/ui/design-references-stitch.md#ep-017--competency-models-and-matrix-ui): `_4` editor/catalog reference.

## Project grounding
- Проверить existing model versions and seed states.
- Свериться with current create/clone flows in CLI/core.

## Implementation plan
- Сделать catalog page with filter and status info.
- Add clone/create draft actions.
- Surface “used by active campaign” hints.

## Scenarios (auto acceptance)
### Setup
- Seed: `S3_model_indicators`, `S3_model_levels`.

### Action
1. Open models list.
2. Filter by kind/status.
3. Clone draft from existing version.

### Assert
- Active and draft versions differentiated.
- Clone creates new draft without mutating source version.

### Client API ops (v1)
- Model list/clone draft ops.

## Manual verification (deployed environment)
- `beta`: review models list, clone a draft, verify it appears as new version.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
