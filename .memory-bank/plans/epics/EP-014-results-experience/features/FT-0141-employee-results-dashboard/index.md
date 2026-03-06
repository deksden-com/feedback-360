# FT-0141 — Employee results dashboard
Status: Planned (2026-03-06)

## User value
Сотрудник понимает свои результаты 360 в одном экране без доступа к raw comments.

## Deliverables
- Summary cards, group breakdown, competency sections.
- Processed comments and summary blocks.
- Empty state when results are not ready.

## Context (SSoT links)
- [Results visibility](../../../../../spec/domain/results-visibility.md): что employee может видеть. Читать, чтобы не показать raw/private data.
- [Anonymity policy](../../../../../spec/domain/anonymity-policy.md): hidden/merged groups behavior. Читать, чтобы summary правильно объяснял отсутствующие блоки.
- [Stitch mapping — EP-014](../../../../../spec/ui/design-references-stitch.md#ep-014--results-experience): employee report visual hierarchy.

## Project grounding
- Прочитать FT-0083 and FT-0101 docs.
- Проверить completed result seeds and processed-text availability.

## Implementation plan
- Пересобрать current results page into structured dashboard.
- Добавить results-ready/empty state.
- Отделить summary, group breakdown and text insights.

## Scenarios (auto acceptance)
### Setup
- Seed: `S9_campaign_completed_with_ai`.

### Action
1. Employee opens `My results`.
2. Switches completed campaigns or sections.

### Assert
- No raw text.
- Processed summary visible.
- Hidden groups explained.

### Client API ops (v1)
- `results.getMyDashboard`.

## Manual verification (deployed environment)
- `beta`: войти как employee with completed campaign and review full dashboard.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
