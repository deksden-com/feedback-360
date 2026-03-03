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

## Campaign ended
После `campaign.status = ended`:
- любые сохранения/submit запрещены (read-only).

