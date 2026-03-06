# FT-0121 — Campaign list and filters
Status: Planned (2026-03-06)

## User value
HR быстро находит нужную кампанию по статусу и срокам, не работая через одну перегруженную операционную страницу.

## Deliverables
- Campaigns list view.
- Filters by status/date/company context.
- Summary counters and links to detail page.

## Context (SSoT links)
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): статусы и допустимые transitions. Читать, чтобы list/filter корректно отражал state machine.
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md): плановые HR campaign surfaces. Читать, чтобы list был частью цельного IA.
- [Stitch mapping — EP-012](../../../../../spec/ui/design-references-stitch.md#ep-012--hr-campaigns-ux): reference для stat cards и campaign list layout.

## Project grounding
- Прочитать [EP-012](../../index.md) и текущий `/hr/campaigns`.
- Проверить существующие filters/commands для campaigns в core/client/CLI.

## Implementation plan
- Добавить отдельный list/dashboard слой перед detail workbench.
- Собирать counters и list items из typed data loaders.
- Сохранить company scoping и compatible deep links.

## Scenarios (auto acceptance)
### Setup
- Seed: `S4_campaign_draft`, `S5_campaign_started_no_answers`, `S8_campaign_ended`, `S9_campaign_completed_with_ai`.

### Action
1. Открыть campaigns list.
2. Фильтровать по status.
3. Открыть одну кампанию.

### Assert
- Counters совпадают с seed.
- Фильтры deterministic.
- Detail page открывается в контексте active company.

### Client API ops (v1)
- Existing campaign list/detail loaders.

## Manual verification (deployed environment)
- `beta`: войти как `hr_admin`, открыть campaigns list, фильтровать по status и открыть detail page.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
