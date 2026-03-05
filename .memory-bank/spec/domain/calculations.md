# Calculations
Status: Draft (2026-03-03)

## Indicators model (1..5 + NA)
- **Per-rater competency score**: среднее по индикаторам компетенции, исключая NA.
- **Per-group competency score**: среднее по оценщикам (rater-average), исключая оценщиков, у которых по компетенции все ответы NA.
  - Причина: “equal rater weighting” снижает перекос, когда один оценщик ответил на большее число индикаторов.
- **Overall per-group score**: среднее по компетенциям с весами competency groups (если включены).
  - Если по компетенции нет валидных ответов (score = `null`) — компетенция исключается из `overall` для этой группы.
- Реализация подтверждена acceptance FT-0051 на `S7 --variant na_heavy_peer` (равный вклад оценщиков при NA-heavy peer).

## Levels model (1..4 + UNSURE)
UI-ориентированные результаты:
- `mode_level` (может быть `null`, если нет доминанты).
- `distribution` по уровням 1..4.
- `n_valid`, `n_unsure`.

Для внутренних агрегаций допускается `mean_level` (по 1..4), исключая UNSURE, но UI не должен выдавать её как “точную” метрику.

Tie-break:
- Если есть ничья за mode — `mode_level = null` и показываем распределение (best practice: не “выдумывать” точность).

MVP implementation note (FT-0054):
- `results.getHrView` для `modelKind=levels` возвращает per-competency summaries:
  - `managerLevels|peersLevels|subordinatesLevels|selfLevels|otherLevels`,
  - в каждом summary: `modeLevel`, `distribution(level1..4)`, `nValid`, `nUnsure`.
- Для internal numeric aggregation (`groupOverall` / `overallScore`) используются только валидные уровни `1..4`; `UNSURE` исключается.

## Rater group weights (default + normalization)
Default (MVP recommended):
- `manager`: 40%
- `peers`: 30%
- `subordinates`: 30%
- `self`: 0% (всегда)

Если какая-то группа отсутствует/скрыта из-за анонимности/нет валидных ответов:
- применяем нормализацию на оставшиеся группы (исключая self),
- при наличии ровно двух групп — распределяем 50/50 (простое правило, понятное HR).
 - если остаётся одна группа — её вес становится 100%.
- при `merge_to_other`: `other` получает базовый вес как сумма merged-групп, после чего участвует в той же нормализации (правило 50/50 для двух групп сохраняется).

MVP implementation note (FT-0053):
- `results.getHrView` возвращает:
  - `configuredGroupWeights` (из кампании, `self` принудительно 0),
  - `effectiveGroupWeights` (после исключения hidden/absent групп),
  - `overallScore` как weighted aggregate по `groupOverall` с `effectiveGroupWeights`.
