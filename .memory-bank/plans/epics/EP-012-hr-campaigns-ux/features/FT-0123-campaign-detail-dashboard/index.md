# FT-0123 — Campaign detail dashboard and daily operations
Status: Planned (2026-03-06)

## User value
HR видит progress, lock status и lifecycle actions одной кампании на одном экране.

## Deliverables
- Detail dashboard with overview/progress/actions.
- Lock banner and started/ended restrictions.
- AI retry panel and action cluster.

## Context (SSoT links)
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): transitions и read-only behavior. Читать, чтобы кнопки точно соответствовали state machine.
- [Assignments and matrix](../../../../../spec/domain/assignments-and-matrix.md): ограничения до/после lock. Читать, чтобы detail dashboard не позволял запрещённые edits.
- [Stitch mapping — EP-012](../../../../../spec/ui/design-references-stitch.md#ep-012--hr-campaigns-ux): summary/action grouping reference.

## Project grounding
- Прочитать текущий HR workbench and FT-0084 docs.
- Проверить campaign progress and AI retry flows.

## Implementation plan
- Разбить существующий workbench на overview sections.
- Явно подсвечивать reason for disabled actions.
- Добавить summary blocks и structured action zones.

## Scenarios (auto acceptance)
### Setup
- Seed: `S4_campaign_draft`, `S6_campaign_started_some_drafts`, `S8_campaign_ended`, `S9_campaign_completed_with_ai`.

### Action
1. Start draft campaign.
2. Дождаться/смоделировать first draft save and lock.
3. Проверить ended/ai_failed actions.

### Assert
- Lock banner появляется вовремя.
- Недопустимые действия disabled/hidden с пояснением.
- AI retry surface показывает корректный current state.

### Client API ops (v1)
- Campaign start/stop/end/progress/AI retry ops.

## Manual verification (deployed environment)
- `beta`: пройти путь draft → started → locked → ended/ai_failed и проверить реакцию detail dashboard.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
