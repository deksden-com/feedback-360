# FT-0152 — Manager team results dashboard
Status: Planned (2026-03-06)

## User value
Руководитель видит результаты подчинённых в разрешённом объёме и не нарушает анонимность других групп.

## Deliverables
- Team results dashboard with subject switcher.
- Hidden/merged group indicators.
- Manager-safe summary and drill-down.

## Context (SSoT links)
- [Results visibility](../../../../../spec/domain/results-visibility.md): manager scope and restrictions. Читать, чтобы UI показывал только допустимое.
- [Anonymity policy](../../../../../spec/domain/anonymity-policy.md): threshold and merge/hide rules. Читать, чтобы правильно маркировать hidden groups.
- [Stitch mapping — EP-015](../../../../../spec/ui/design-references-stitch.md#ep-015--results-experience): manager-oriented reference patterns.

## Project grounding
- Проверить current `/results/team` and its role checks.
- Свериться with small-group variants in seeds and GS2.

## Implementation plan
- Добавить subject switcher and structured group sections.
- Явно объяснять unavailable groups.
- Сохранять strict manager scoping.

## Scenarios (auto acceptance)
### Setup
- Seed: `S9_campaign_completed_with_ai`, plus small-group variants.

### Action
1. Manager opens team results.
2. Switches between subjects.

### Assert
- Small groups hidden/merged as configured.
- Manager block visible where allowed.
- Raw text absent.

### Client API ops (v1)
- `results.getTeamDashboard`.

## Manual verification (deployed environment)
- `beta`: открыть team results разных подчинённых и проверить explanations on hidden groups.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
