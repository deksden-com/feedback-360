# FT-0053 — Weights normalization (missing/hidden groups)
Status: Draft (2026-03-03)

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
1) Вызвать витрину результатов (например `results.getMyDashboard`) для `handles.employee.subject_main` (auth context employee).

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
- Automated test: `packages/core/test/ft/ft-0053-weight-normalization.test.ts` (unit+integration) проверяет effective weights (self=0, missing/hidden → 50/50/100).
- Must run: `pnpm -r test` + кейс `S7 --variant no_subordinates`.
