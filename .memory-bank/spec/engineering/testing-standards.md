# Testing standards
Status: Draft (2026-03-03)

## Levels
- Unit (core): policies/calculators/transitions (быстро, без БД).
- Integration: миграции + seed + use-cases на реальной БД.
- Contract: runtime-валидация DTO/ошибок и совместимость схем.
- E2E: Playwright golden flows (минимум, только критичное).

## Completion rule
- Фича не считается закрытой, пока acceptance-сценарий и обязательные тесты не прогнаны и не зафиксированы в evidence.
- Детальные правила фиксации evidence и traceability:
  - [Delivery standards](delivery-standards.md) — commit/PR требования, acceptance gate и обязательный формат evidence. Читать, чтобы тестовые прогоны были не “на словах”, а проверяемыми артефактами.

## Conventions (placement & naming)
Цель: чтобы ИИ-агент мог запускать проверки детерминированно и “по имени фичи/сценария”.

- FT acceptance tests (Vitest):
  - 1 фича = минимум 1 тестовый файл, имя включает FT id.
  - Target path (recommended): `packages/core/test/ft/ft-XXXX.test.ts`.
  - Если тест интеграционный и требует БД/миграций — это всё равно FT acceptance test, просто он поднимает БД и вызывает seeds.
- GS (golden scenarios):
  - Если сценарий требует UI — `apps/web/playwright/gsX-*.spec.ts`.
  - Если UI не нужен — можно держать GS как integration test на ops (Vitest) в `packages/core/test/gs/gsX-*.test.ts`.
- Запуск:
  - “всё”: `pnpm -r test`
  - “одну фичу/сценарий”: через фильтр Vitest по имени файла/теста (конкретную команду фиксируем в package scripts после scaffold).

## Seeds
Seeds — часть тестового контракта:
- seed scenario создаёт состояние и возвращает `handles -> ids`,
- тесты не хардкодят числовые id.

Ссылки (аннотированные):
- [Seed scenarios](../testing/seed-scenarios.md) — правила seed и стартовый набор сценариев. Читать, чтобы тесты были детерминированными и воспроизводимыми.
- [Golden scenarios](../testing/golden-scenarios.md) — каноничные сквозные сценарии. Читать, чтобы e2e покрывал основные риски минимальным набором тестов.
