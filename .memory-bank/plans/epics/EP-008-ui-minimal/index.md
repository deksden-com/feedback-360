# EP-008 — Minimal UI (thin)
Status: In Progress (2026-03-05)

## Goal
Минимальный UI поверх typed client: HR стартует кампанию, сотрудник заполняет анкеты, видит результаты.

## Features (vertical slices)
- [Feature catalog](features/index.md): список фич EP-008 с acceptance сценариями. Читать, чтобы UI оставался тонким поверх typed client.

## Scenarios / tests
- Playwright e2e для GS1 (минимально)

## Progress report (evidence-based)
- `as_of`: 2026-03-05
- `total_features`: 4
- `completed_features`: 3
- `evidence_confirmed_features`: 3
- verification link:
  - [Verification matrix](../../verification-matrix.md) — execution evidence по EP-008. Читать, чтобы отслеживать подтверждённый прогресс по одному SSoT-источнику.

## Memory bank updates (after EP completion)
- Подтвердить guardrails “UI тонкий” (только typed client): [Architecture guardrails](../../../spec/engineering/architecture-guardrails.md) — запреты на импорт core. Читать, чтобы UI не начал “жить отдельно”.
- Синхронизировать UI flows с контрактом операций: [UI sitemap & flows](../../../spec/ui/sitemap-and-flows.md) — экраны и переходы. Читать, чтобы UI покрывал MVP сценарии без лишней логики.
- Обновить Playwright сценарии как подтверждение GS1: [Test strategy](../../../spec/testing/test-strategy.md) — какие e2e нужны. Читать, чтобы e2e оставались минимальными, но полезными.
