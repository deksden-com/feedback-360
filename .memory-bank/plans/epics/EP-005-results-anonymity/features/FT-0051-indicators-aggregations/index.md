# FT-0051 — Indicators aggregations (numbers)
Status: Draft (2026-03-03)

## User value
Сотрудник/руководитель/HR видят корректные числовые агрегаты по компетенциям и группам оценщиков.

## Deliverables
- Агрегации indicators:
  - per-rater competency avg (exclude NA)
  - per-group avg (equal rater weighting)
  - overall (weights by competency groups)

## Context (SSoT links)
- [Calculations](../../../../../spec/domain/calculations.md): формулы для indicators, NA semantics и веса групп. Читать, чтобы агрегаты считались “как в домене”.
- [Results visibility](../../../../../spec/domain/results-visibility.md): что именно показываем разным ролям. Читать, чтобы API не отдавал лишние поля.
- [Seed S7](../../../../../spec/testing/seeds/s7-campaign-started-some-submitted.md): базовый seed для агрегаций и анонимности. Читать, чтобы понять доступные handles и где добавить variants для NA-heavy.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист реализации. Читать, чтобы расчёты были в core и покрыты unit тестами.

## Acceptance (auto)
### Setup
Seed: `S7_campaign_started_some_submitted --variant na_heavy_peer --json` → `handles.campaign.main`, `handles.employee.subject_main`.

### Action (integration test)
1) Под auth context роли `hr_admin` (или `hr_reader`) вызвать `results.getHrView`:
  - campaign: `handles.campaign.main`
  - subject: `handles.employee.subject_main`

### Assert
- NA не влияет на avg (исключён).
- Per-group avg использует equal rater weighting: один rater не “перекрывает” остальных количеством не-NA ответов.

## Implementation plan (target repo)
- Core (calculators):
  - Реализовать расчёты:
    - `competency_score_per_rater = mean(indicator_scores excluding NA)`
    - `competency_score_per_group = mean(per_rater_scores)` (equal rater weighting)
    - `overall_score = weighted_mean(competencies, group_weights)` (self=0)
  - Если по компетенции у rater все индикаторы NA → `per_rater_score=null` и не входит в group mean.
- Results storage:
  - На MVP можно считать on-the-fly (query + калькулятор) или писать материализованные агрегаты; выбор должен быть единым по всем витринам.
- Тонкие моменты:
  - Не путать “среднее по всем ответам” и “equal rater weighting”: доменное требование — второе.

## Tests
- Unit: калькулятор indicators (NA исключение, equal rater weighting).
- Integration: `results hr` возвращает ожидаемые числа на `S7` (включая NA-heavy variant).

## Memory bank updates
- При изменении формул обновить: [Calculations](../../../../../spec/domain/calculations.md) — SSoT. Читать, чтобы UI/CLI не показывали “другие числа”.

## Verification (must)
- Automated test: `packages/core/test/ft/ft-0051-indicators-aggregations.test.ts` (unit+integration) проверяет NA исключение и equal rater weighting на `S7 --variant na_heavy_peer`.
- Must run: `pnpm -r test` + сравнение ожидаемых агрегатов.
