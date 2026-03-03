# EP-005 — Results + anonymity + weights
Status: Draft (2026-03-03)

## Goal
Считать результаты корректно и безопасно (threshold=3, per-competency threshold, merge/hide, weights normalization).

## Features (vertical slices)
- [Feature catalog](features/index.md): список фич EP-005 с acceptance сценариями. Читать, чтобы результаты соответствовали best practices (анонимность/веса/edge cases).

## Scenarios / tests
- GS2 (small group)
- GS9 (levels rules)

## Memory bank updates (after EP completion)
- Подтвердить формулы и семантику “levels”: [Calculations](../../../spec/domain/calculations.md) — indicators vs levels, mode/tie/UNSURE. Читать, чтобы UI/CLI показывали правильную “степень точности”.
- Зафиксировать анонимность как реальный policy (threshold, per-competency, merge/hide): [Anonymity policy](../../../spec/domain/anonymity-policy.md) — правила скрытия и edge cases. Читать, чтобы избежать deanonymization.
- Синхронизировать витрины результатов с приватностью: [Results visibility](../../../spec/domain/results-visibility.md) — кто видит raw vs processed. Читать, чтобы employee не получил оригинальные комментарии.
