# FT-0162 — Model editor
Status: Planned (2026-03-06)

## User value
HR задаёт структуру модели оценки и публикует корректные версии без технических обходов.

## Deliverables
- Draft model editor for indicators/levels.
- Competency groups and weight validation.
- Publish/lock draft version flow.

## Context (SSoT links)
- [Competency models](../../../../../spec/domain/competency-models.md): canonical structure of groups/competencies/indicators/levels. Читать, чтобы editor не создавал invalid shapes.
- [Calculations](../../../../../spec/domain/calculations.md): why weights and score semantics matter. Читать, чтобы validation corresponded to reporting rules.
- [Stitch mapping — EP-016](../../../../../spec/ui/design-references-stitch.md#ep-016--competency-models-and-matrix-ui): section layout reference.

## Project grounding
- Проверить model draft/publish rules in core/client/CLI.
- Свериться with both indicators and levels variants.

## Implementation plan
- Build sectioned editor with validation hints.
- Keep model draft editing isolated from active versions.
- Provide publish flow only for valid drafts.

## Scenarios (auto acceptance)
### Setup
- Seed: `S3_model_indicators`, `S3_model_levels`.

### Action
1. Open draft model.
2. Add/edit group and competencies.
3. Validate.
4. Publish.

### Assert
- Invalid weights blocked.
- Correct draft publishes.
- Used versions remain immutable.

### Client API ops (v1)
- Model get/update/publish ops.

## Manual verification (deployed environment)
- `beta`: edit a draft model, trigger validation, then publish a valid version.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
