# FT-0053 — Weights normalization (missing/hidden groups)
Status: Completed (2026-03-05)

## User value
Итоговый балл корректен даже если группа отсутствует или скрыта (анонимность).

## Deliverables
- Default weights: manager 40 / peers 30 / subordinates 30 / self 0.
- Нормализация:
  - исключаем self,
  - если осталось 2 группы → 50/50,
  - если 1 группа → 100%.

## Context (SSoT links)
- [Calculations](../../../../../spec/domain/calculations.md): веса групп и правило self=0. Читать, чтобы нормализация не нарушила agreed формулу overall.
- [Anonymity policy](../../../../../spec/domain/anonymity-policy.md): когда группы скрываются. Читать, чтобы нормализация работала для “скрытых” групп, а не только “отсутствующих”.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист. Читать, чтобы нормализация была unit-тестируемой политикой.

## Acceptance (auto)
### Setup
Seed: `S7_campaign_started_some_submitted --variant no_subordinates --json` → `handles.campaign.main`, `handles.employee.subject_main`.

### Action (integration test)
1) Вызвать `results.getHrView` для `handles.employee.subject_main` (auth context `hr_admin`).
2) Для проверки merge-case вызвать `results.getHrView` c `smallGroupPolicy=merge_to_other` на `S7 --variant peers2`.

### Assert
- Веса нормализованы: manager=50%, peers=50% (subordinates отсутствуют/скрыты).
- Self не влияет на итоговый балл.

## Implementation plan (target repo)
- Core (weights policy):
  - Вход: `configured_weights` (manager/peers/subordinates/self) + `groups_present_and_visible`.
  - Правила:
    - self всегда 0 в effective weights (даже если в настройках случайно другое).
    - Если peers/subordinates отсутствуют или скрыты (анонимность) → исключаем из нормализации.
    - Если остались manager+peers → 50/50 (agreed default).
    - Если осталась одна группа → 100%.
  - Выход: `effective_weights` (нормализованные, сумма=100).
- Тонкие моменты:
  - Нормализация должна использоваться всеми витринами одинаково (employee/manager/hr).
  - Если `merge_to_other`, нужно определить, как weight “other” участвует (обычно: other получает сумму весов merged групп, затем нормализуем).

## Tests
- Unit: normalizeWeights для кейсов “нет subordinates”, “нет peers”, “остался один manager”.
- Integration: overall score в results учитывает effective weights (self=0).

## Memory bank updates
- При изменении правил нормализации обновить: [Calculations](../../../../../spec/domain/calculations.md) — SSoT. Читать, чтобы настройки кампании и итоговые цифры были согласованы.

## Verification (must)
- Automated test: `packages/core/src/ft/ft-0053-weight-normalization.test.ts` (integration) проверяет effective weights (self=0, missing/hidden → 50/50/100).
- Must run: `pnpm -r test` + кейс `S7 --variant no_subordinates`.

## Project grounding (2026-03-05)
- [Calculations](../../../../../spec/domain/calculations.md): SSoT по default weights и нормализации. Читать, чтобы `overallScore` считался по agreed формуле.
- [Anonymity policy](../../../../../spec/domain/anonymity-policy.md): когда группы считаются скрытыми/merged. Читать, чтобы исключать их из effective weights корректно.
- [Seed S7](../../../../../spec/testing/seeds/s7-campaign-started-some-submitted.md): variants `no_subordinates`/`peers2`. Читать, чтобы acceptance был детерминирован.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): порядок vertical-slice + evidence. Читать, чтобы закрыть фичу проверяемо.

## Quality checks evidence (2026-03-05)
- `pnpm --filter @feedback-360/api-contract lint && pnpm --filter @feedback-360/api-contract typecheck` → passed.
- `pnpm --filter @feedback-360/db lint && pnpm --filter @feedback-360/db typecheck` → passed.
- `pnpm --filter @feedback-360/core lint && pnpm --filter @feedback-360/core typecheck` → passed.
- `pnpm --filter @feedback-360/client lint && pnpm --filter @feedback-360/client typecheck` → passed.
- `pnpm --filter @feedback-360/cli lint && pnpm --filter @feedback-360/cli typecheck` → passed.

## Acceptance evidence (2026-03-05)
- `pnpm --filter @feedback-360/cli exec vitest run src/ft-0051-results-hr-cli.test.ts src/ft-0052-results-hr-anonymity-cli.test.ts` → passed (no-regression contract/CLI).
- `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0051-indicators-aggregations.test.ts` → passed.
- `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0052-anonymity.test.ts` → passed.
- `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0053-weight-normalization.test.ts` → passed.
- `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts` → passed (`S7 --variant no_subordinates`).
- CLI scenario (real DB, seed `S7_campaign_started_some_submitted --variant no_subordinates`) via `pnpm exec tsx packages/cli/src/index.ts`:
  - `results hr --campaign ... --subject ... --json` → `effectiveGroupWeights={manager:50,peers:50,subordinates:0,self:0}`, `overallScore=3.5`.
