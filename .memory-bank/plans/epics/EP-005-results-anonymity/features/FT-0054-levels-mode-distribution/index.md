# FT-0054 — Levels: mode + distribution
Status: Draft (2026-03-03)

## User value
Для уровневых моделей система показывает “наиболее частый уровень” и распределение, не создавая ложной точности.

## Deliverables
- `mode_level` (tie→null) + `distribution` + `n_valid/n_unsure`.
- UNSURE исключается из агрегаций.

## Context (SSoT links)
- [Competency models](../../../../../spec/domain/competency-models.md): уровневые модели (1..4 + UNSURE) и структура данных. Читать, чтобы seeds и таблицы поддерживали levels.
- [Calculations](../../../../../spec/domain/calculations.md): правила mode/tie и UNSURE. Читать, чтобы “уровни” не превращались в ложную среднюю оценку.
- [GS9 Levels rules](../../../../../spec/testing/scenarios/gs9-levels.md): golden сценарий. Читать, чтобы acceptance фиксировал tie→null и UNSURE исключение.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист. Читать, чтобы levels логика была в core и unit-тестируемой.

## Acceptance (auto)
### Setup
Seed: `S7_campaign_started_some_submitted --variant levels_tie --json` (planned) с:
  - UNSURE ответами,
  - tie за mode (например 2 и 3 поровну).

### Action (integration test)
1) Вызвать витрину результатов для levels кампании (например `results.getMyDashboard`) и получить `mode_level/distribution`.

### Assert
- UNSURE не входит в `n_valid` и в mean.
- При tie `mode_level=null`, distribution присутствует.

## Implementation plan (target repo)
- DB + seeds:
  - Добавить levels variant модели (`competency_levels` 1..4) и seed `S3_model_levels`.
  - Добавить levels-кампанию/ответы, где:
    - есть UNSURE,
    - есть tie (2 и 3 поровну) для одной группы.
- Core:
  - Для каждой (subject, competency, group):
    - посчитать `distribution` (counts/percentages 1..4),
    - `n_unsure` отдельно,
    - `mode_level` если есть уникальный максимум, иначе `null`.
  - Numeric mean (если считаем для внутренних нужд) не показывать как основной UI/CLI вывод.

## Tests
- Unit: `mode_level` tie→null; UNSURE исключение.
- Integration: `results my` на levels seed возвращает mode/distribution как в GS9.

## Memory bank updates
- При изменении tie-rule обновить: [Calculations](../../../../../spec/domain/calculations.md) — SSoT. Читать, чтобы UI/CLI и тесты интерпретировали tie одинаково.

## Verification (must)
- Automated test: `packages/core/test/ft/ft-0054-levels.test.ts` (unit+integration) проверяет tie→null и UNSURE исключение на `S7 --variant levels_tie`.
- Must run: GS9 должен быть зелёным.
