# EP-008 — Minimal UI (thin)
Status: Draft (2026-03-03)

## Goal
Минимальный UI поверх typed client: HR стартует кампанию, сотрудник заполняет анкеты, видит результаты.

## Features (vertical slices)
- [Feature catalog](features/index.md): список фич EP-008 с acceptance сценариями. Читать, чтобы UI оставался тонким поверх typed client.

## Scenarios / tests
- Playwright e2e для GS1 (минимально)

## Memory bank updates (after EP completion)
- Подтвердить guardrails “UI тонкий” (только typed client): [Architecture guardrails](../../../spec/engineering/architecture-guardrails.md) — запреты на импорт core. Читать, чтобы UI не начал “жить отдельно”.
- Синхронизировать UI flows с контрактом операций: [UI sitemap & flows](../../../spec/ui/sitemap-and-flows.md) — экраны и переходы. Читать, чтобы UI покрывал MVP сценарии без лишней логики.
- Обновить Playwright сценарии как подтверждение GS1: [Test strategy](../../../spec/testing/test-strategy.md) — какие e2e нужны. Читать, чтобы e2e оставались минимальными, но полезными.
