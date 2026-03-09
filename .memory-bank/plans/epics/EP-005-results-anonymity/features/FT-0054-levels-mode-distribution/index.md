---
description: FT-0054-levels-mode-distribution feature plan and evidence entry for EP-005-results-anonymity.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-005-results-anonymity/index.md
epic: EP-005
feature: FT-0054
---


# FT-0054 — Levels: mode + distribution
Status: Completed (2026-03-05)

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
Seed: `S7_campaign_started_some_submitted --variant levels_tie --json` с:
  - UNSURE ответами,
  - tie за mode (например 2 и 3 поровну).

### Action (integration test)
1) Вызвать `results.getHrView` с `smallGroupPolicy=merge_to_other` для levels-кампании и получить `mode_level/distribution`.

### Assert
- UNSURE не входит в `n_valid` и в mean.
- При tie `mode_level=null`, distribution присутствует.

## Implementation plan (target repo)
- DB + seeds:
  - Добавить levels variant модели (`competency_levels` 1..4) и seed-variant `S7 --variant levels_tie`.
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
- Integration: `results.getHrView` на levels seed возвращает mode/distribution как в GS9.

## Memory bank updates
- При изменении tie-rule обновить: [Calculations](../../../../../spec/domain/calculations.md) — SSoT. Читать, чтобы UI/CLI и тесты интерпретировали tie одинаково.

## Verification (must)
- Automated test: `packages/core/src/ft/ft-0054-levels.test.ts` (integration) проверяет tie→null и UNSURE исключение на `S7 --variant levels_tie`.
- Must run: GS9 должен быть зелёным.

## Project grounding (2026-03-05)
- [Calculations](../../../../../spec/domain/calculations.md): SSoT по mode/tie и исключению UNSURE. Читать, чтобы levels-агрегации не имитировали “ложную точность”.
- [Seed S7](../../../../../spec/testing/seeds/s7-campaign-started-some-submitted.md): variant `levels_tie` и handles. Читать, чтобы acceptance был детерминированным.
- [GS9 Levels rules](../../../../../spec/testing/scenarios/gs9-levels.md): golden intent для tie→null и UNSURE. Читать, чтобы тест проверял именно бизнес-инварианты.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист vertical-slice + evidence. Читать, чтобы фича считалась закрытой только после проверок.

## Quality checks evidence (2026-03-05)
- `pnpm --filter @feedback-360/api-contract lint && pnpm --filter @feedback-360/api-contract typecheck` → passed.
- `pnpm --filter @feedback-360/db lint && pnpm --filter @feedback-360/db typecheck` → passed.
- `pnpm --filter @feedback-360/core lint && pnpm --filter @feedback-360/core typecheck` → passed.
- `pnpm --filter @feedback-360/client typecheck` → passed.
- `pnpm --filter @feedback-360/cli lint && pnpm --filter @feedback-360/cli typecheck` → passed.

## Acceptance evidence (2026-03-05)
- `pnpm --filter @feedback-360/cli exec vitest run src/ft-0051-results-hr-cli.test.ts src/ft-0052-results-hr-anonymity-cli.test.ts` → passed (no-regression CLI/contract).
- `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0051-indicators-aggregations.test.ts` → passed.
- `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0052-anonymity.test.ts` → passed.
- `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0053-weight-normalization.test.ts` → passed.
- `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0054-levels.test.ts` → passed.
- `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts` → passed (`S7 --variant levels_tie`).
- CLI scenario (real DB, seed `S7_campaign_started_some_submitted --variant levels_tie`) via `pnpm exec tsx packages/cli/src/index.ts`:
  - `results hr --small-group-policy merge_to_other --json` → `modelKind=levels`, `otherLevels.modeLevel=null`, `otherLevels.distribution={2:2,3:2}`, `managerLevels.nUnsure=1`, `effectiveGroupWeights.other=100`, `overallScore=2.5`.

## Notes
- DB-backed FT tests для S7 seeds выполняем последовательно (не в одном vitest процессе), чтобы избежать race-condition при одновременном reset/seed.
