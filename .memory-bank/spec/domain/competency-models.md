# Competency models
Status: Draft (2026-03-03)

## Versioning
Модель компетенций хранится версионно: кампания ссылается на конкретную `model_version_id`.

## Kinds
- `indicators`: компетенция содержит список индикаторов, ответы 1..5 + NA.
- `levels`: компетенция содержит 4 уровня (1..4) + UNSURE, UI показывает mode + distribution.

## Comments (agreed)
- Один комментарий **на компетенцию** (опционально).
- Опциональный общий “итоговый комментарий” анкеты.

## Mutability rules
- В `draft` кампании можно менять `model_version_id`.
- После `started` менять `model_version_id` нельзя.
