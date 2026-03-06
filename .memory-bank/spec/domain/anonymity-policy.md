# Anonymity policy (threshold = 3)
Status: Draft (2026-03-03)

Цель: исключить deanonymization и обеспечить стандартные правила 360.

## Groups
Каноничные группы оценщиков:
- `manager` — всегда **не анонимна** (показываем персонально).
- `peers` — анонимная группа, threshold применяется.
- `subordinates` — анонимная группа, threshold применяется.
- `self` — самооценка, показывается всегда, **вес = 0%** в финальном балле.
- `other` — опциональная группа для режима “слияния” (peers+subordinates).

## What counts towards threshold
- В threshold считаем **только submitted** анкеты.
- Для indicators учитываем только ответы с score 1..5 (NA не считается валидным ответом).
- Для levels учитываем только ответы с level 1..4 (UNSURE не считается валидным ответом).

## Where threshold applies (best-practice for leakage control)
Threshold применяется:
1) **На уровне группы в целом** для subject в кампании (показывать ли блок группы вообще).
2) **На уровне (group × competency)**: если по конкретной компетенции `n_valid < 3`, скрываем строку этой компетенции для этой группы (или помечаем “недостаточно данных” — UI-решение).

Это консервативнее и ближе к “best practice”, чем проверка только “по группе целиком”, потому что NA/UNSURE могут уменьшать эффективный n и создавать риск deanonymization.

## Small group handling (peers/subordinates < 3)
Политика кампании: `small_group_policy`:
- `hide` (default): скрываем проблемную группу/строку.
- `merge_to_other`: сливаем peers + subordinates в `other` и применяем threshold к объединённой группе.

MVP implementation note (FT-0052):
- `results.getHrView` возвращает явные flags:
  - `groupVisibility.{peers,subordinates}` = `shown|hidden|merged`,
  - `groupVisibility.other` = `shown|hidden` (только при merge policy),
  - per-competency visibility (`peersVisibility`, `subordinatesVisibility`, `otherVisibility`).
- Эти flags — SSoT для UI/CLI отображения анонимности и merge semantics.

## Open text
- Employee/Manager видят **только AI-агрегированный текст** (summary/processed), и только если выполняется threshold для соответствующей группы.
- `hr_admin` видит raw-комментарии для operational HR review.
- `hr_reader` видит только processed/summary без raw, даже в HR view.
