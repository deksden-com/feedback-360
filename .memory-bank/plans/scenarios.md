# Scenario registry (planning view)
Status: Draft (2026-03-03)

Цель: привязать “план” к проверяемым сценариям и seed состояниям.

Ссылки:
- [`../spec/testing/golden-scenarios.md`](../spec/testing/golden-scenarios.md) — каноничные golden сценарии (setup→action→assert). Читать, чтобы e2e покрывал критичные риски минимальным числом тестов.
- [`../spec/testing/seed-scenarios.md`](../spec/testing/seed-scenarios.md) — принципы seed сценариев и стартовый список. Читать, чтобы сценарии были воспроизводимы и не зависели от случайных id.

MVP registry (draft):
- GS1 Happy path (indicators): базовый сквозной путь HR→employee→results→AI (`mvp_stub` на MVP, webhook в следующем этапе).
- GS2 Small group anonymity: edge case peers=2 и пересчёт весов/видимости.
- GS3 Webhook security & idempotency: подпись + повторная доставка.
