# Questionnaires
Status: Draft (2026-03-03)

## Model
Анкета = “один rater оценивает одного subject” в конкретной кампании.

## States
- `not_started`: ещё нет сохранённых ответов.
- `in_progress`: есть draft-save.
- `submitted`: анкета отправлена; ответы immutable.

## Draft save / submit rules
- Draft save: сохраняем частично заполненную анкету в любом порядке.
- Submit: валидируем ответы по всем компетенциям (либо валидный score/level, либо NA/UNSURE по правилам модели).
- Комментарии опциональны (на компетенцию и общий финальный).

## Campaign read-only states
После `campaign.status` в одном из состояний:
- `ended`
- `processing_ai`
- `ai_failed`
- `completed`

любые `draft save`/`submit` запрещены (read-only, доменная ошибка `campaign_ended_readonly`).
