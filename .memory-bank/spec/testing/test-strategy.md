# Test strategy (draft)
Status: Draft (2026-03-03)

Уровни:
- **Core unit**: policies (anonymity, weights, transitions), calculators.
- **Integration**: DB migrations + основные use-cases на реальной БД.
- **Contract**: api-contract schemas + примеры payload.
- **E2E (Playwright минимально)**: 2–3 сквозных сценария.

Golden flows (MVP):
1) HR создаёт кампанию → start → сотрудник draft/save → submit → кампанию end → результаты видны.
2) Edge: peers=2 → блок peers скрыт/слит по policy, веса пересчитаны.
3) AI webhook happy-path: `processing_ai -> completed`, employee видит только processed/summary.

