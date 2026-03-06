# FT-0132 — Structured questionnaire fill flow
Status: Planned (2026-03-06)

## User value
Пользователь спокойно проходит форму оценки по компетенциям и получает понятную обратную связь при save/submit.

## Deliverables
- Structured multi-section form.
- Progress header.
- Save draft feedback and submit confirmation.

## Context (SSoT links)
- [Questionnaires](../../../../../spec/domain/questionnaires.md): per-competency comments, optional final comment, submit rules. Читать, чтобы form точно отражала домен.
- [Testing standards](../../../../../spec/engineering/testing-standards.md): для этой фичи нужны e2e и regression tests. Читать, чтобы сразу спроектировать проверяемый flow.
- [Stitch mapping — EP-013](../../../../../spec/ui/design-references-stitch.md#ep-013--questionnaire-experience): основной visual reference формы.

## Project grounding
- Проверить текущую форму и действующие route handlers.
- Свериться с constraints по optional comments и read-only transitions.

## Implementation plan
- Разбить вопросы на понятные секции.
- Показать progress and save state.
- Сохранять thin UI contract with server responses.

## Scenarios (auto acceptance)
### Setup
- Seed: `S5_campaign_started_no_answers`, `S6_campaign_started_some_drafts`.

### Action
1. Заполнить часть компетенций.
2. Save draft.
3. Reload.
4. Submit.

### Assert
- Draft восстанавливается.
- Submit финализирует questionnaire.
- User sees success and next step.

### Client API ops (v1)
- `questionnaire.getDraft`, `questionnaire.saveDraft`, `questionnaire.submit`.

## Manual verification (deployed environment)
- `beta`: открыть анкету, сохранить draft, обновить страницу, дозаполнить и отправить.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
