# FT-0122 — Campaign create and draft configuration
Status: Planned (2026-03-06)

## User value
HR может создать campaign draft и настроить её без CLI: выбрать модель, сроки, веса и reminders.

## Deliverables
- Create/edit draft flow.
- Multi-section form for model, dates, timezone, self-eval, weights, reminders.
- Validation states and saved draft reopen flow.

## Context (SSoT links)
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): что можно менять в `draft`. Читать, чтобы form не обещала недоступные изменения.
- [Calculations](../../../../../spec/domain/calculations.md): веса групп и их ограничения. Читать, чтобы validation была согласована с доменом.
- [Stitch mapping — EP-012](../../../../../spec/ui/design-references-stitch.md#ep-012--hr-campaigns-ux): section layout reference.

## Project grounding
- Прочитать текущие campaign settings в spec/client-api/cli.
- Свериться с reminder/timezone rules.

## Implementation plan
- Собрать draft editor поверх existing create/update ops.
- Делать optimistic UX только там, где это не нарушает authoritative backend validation.
- Сохранять progress section-by-section или whole draft.

## Scenarios (auto acceptance)
### Setup
- Seed: `S3_model_indicators`, `S3_model_levels`, `S4_campaign_draft`.

### Action
1. HR создаёт новый draft.
2. Заполняет настройки.
3. Сохраняет и повторно открывает draft.

### Assert
- Draft сохраняется.
- Validation понятна и не даёт сломанных комбинаций.
- Повторное открытие восстанавливает введённые данные.

### Client API ops (v1)
- Campaign create/update draft operations.

## Manual verification (deployed environment)
- `beta`: создать draft campaign, заполнить form, сохранить, открыть заново и сравнить состояние.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
