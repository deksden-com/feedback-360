---
description: FT-0051-indicators-aggregations feature plan and evidence entry for EP-005-results-anonymity.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-005-results-anonymity/index.md
epic: EP-005
feature: FT-0051
---


# FT-0051 — Indicators aggregations (numbers)
Status: Completed (2026-03-04)

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
- Automated test: `packages/core/src/ft/ft-0051-indicators-aggregations.test.ts` (integration) проверяет NA исключение и equal rater weighting на `S7 --variant na_heavy_peer`.
- Must run: `pnpm -r test` + сравнение ожидаемых агрегатов.

## Project grounding (2026-03-04)
- [Calculations](../../../../../spec/domain/calculations.md): формулы indicators и семантика NA/equal rater weighting. Читать, чтобы считать агрегаты строго по доменным правилам.
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): каноничный список op/roles. Читать, чтобы `results.getHrView` и RBAC были реализованы без расхождений с клиентами.
- [Seed S7](../../../../../spec/testing/seeds/s7-campaign-started-some-submitted.md): seed и variants для deterministic acceptance. Читать, чтобы проверить NA-heavy кейс на воспроизводимых данных.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): порядок vertical-slice реализации. Читать, чтобы фича завершалась кодом, тестами и evidence.

## Quality checks evidence (2026-03-04)
- `pnpm --filter @feedback-360/api-contract lint && pnpm --filter @feedback-360/api-contract typecheck && pnpm --filter @feedback-360/api-contract test` → passed.
- `pnpm --filter @feedback-360/db lint && pnpm --filter @feedback-360/db typecheck` → passed.
- `pnpm --filter @feedback-360/core lint && pnpm --filter @feedback-360/core typecheck` → passed.
- `pnpm --filter @feedback-360/client lint && pnpm --filter @feedback-360/client typecheck` → passed.
- `pnpm --filter @feedback-360/cli lint && pnpm --filter @feedback-360/cli typecheck` → passed.

## Acceptance evidence (2026-03-04)
- `pnpm --filter @feedback-360/cli exec vitest run src/ft-0051-results-hr-cli.test.ts` → passed.
- `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0051-indicators-aggregations.test.ts` → passed (integration, Supabase pooler).
- `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts` → passed (`S7 --variant na_heavy_peer`).
- CLI scenario (real DB, seed `S7_campaign_started_some_submitted --variant na_heavy_peer`) via `pnpm exec tsx packages/cli/src/index.ts`:
  - `company use ... --role hr_admin` + `results hr --campaign ... --subject ... --json` → `peers_score=3`, `naive_indicator_weighted=2`.
  - `company use ... --role employee` + `results hr --campaign ... --subject ... --json` → `error.code=forbidden`.
