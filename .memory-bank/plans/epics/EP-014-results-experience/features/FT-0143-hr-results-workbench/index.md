# FT-0143 — HR results workbench
Status: Planned (2026-03-06)

## User value
HR видит полный разбор результатов и комментариев сотрудника в одном рабочем интерфейсе.

## Deliverables
- Subject filters and drill-down.
- Raw/processed toggle for `hr_admin`.
- Diagnostics markers for AI/text shaping.

## Context (SSoT links)
- [Results visibility](../../../../../spec/domain/results-visibility.md): различия `hr_admin` vs `hr_reader`. Читать, чтобы toggle and drill-down obeyed permissions.
- [AI processing](../../../../../spec/ai/ai-processing.md): processed comment lifecycle. Читать, чтобы HR UI правильно маркировал AI-derived content.
- [Stitch mapping — EP-014](../../../../../spec/ui/design-references-stitch.md#ep-014--results-experience): report composition reference for HR extension.

## Project grounding
- Прочитать FT-0055, FT-0073, FT-0101.
- Проверить current `/results/hr`.

## Implementation plan
- Разделить HR readers/admin views cleanly.
- Добавить richer filters and diagnostics.
- Preserve existing visibility rules in UI.

## Scenarios (auto acceptance)
### Setup
- Seed: `S9_campaign_completed_with_ai`.

### Action
1. Open HR results as `hr_admin`.
2. Repeat as `hr_reader`.

### Assert
- `hr_admin` sees raw + processed + summary.
- `hr_reader` sees no raw.
- Filters/drill-down preserve access model.

### Client API ops (v1)
- `results.getHrView`.

## Manual verification (deployed environment)
- `beta`: compare `hr_admin` and `hr_reader` on the same completed campaign.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
