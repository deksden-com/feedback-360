# FT-0131 — Questionnaire inbox
Status: Planned (2026-03-06)

## User value
Оценивающий быстро видит свои анкеты, понимает статусы и может вернуться к черновику без лишних переходов.

## Deliverables
- Inbox with filters by status/campaign.
- Resume draft CTA.
- Grouping and status chips.

## Context (SSoT links)
- [Questionnaires](../../../../../spec/domain/questionnaires.md): draft/submit semantics. Читать, чтобы inbox статусы были точными.
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md): место inbox в employee flow. Читать, чтобы не потерять вход в анкету.
- [Stitch mapping — EP-013](../../../../../spec/ui/design-references-stitch.md#ep-013--questionnaire-experience): reference for task list structure.

## Project grounding
- Прочитать FT-0082 и текущий questionnaire list screen.
- Проверить seeded status variants.

## Implementation plan
- Пересобрать current list into richer inbox.
- Добавить grouping/filtering and resume-draft affordance.
- Не дублировать server authority по status.

## Scenarios (auto acceptance)
### Setup
- Seed: `S5_campaign_started_no_answers`, `S6_campaign_started_some_drafts`, `S7_campaign_started_some_submitted`.

### Action
1. Открыть inbox.
2. Переключить фильтры.
3. Resume draft.

### Assert
- Статусы совпадают с seed.
- Resume draft ведёт в правильную анкету.
- Submitted items clearly distinguished.

### Client API ops (v1)
- `questionnaire.listAssigned`, `questionnaire.getDraft`.

## Manual verification (deployed environment)
- `beta`: открыть `My questionnaires`, отфильтровать `in progress`, зайти обратно в draft.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
