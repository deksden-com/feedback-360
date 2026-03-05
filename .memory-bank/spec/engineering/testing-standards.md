# Testing standards
Status: Draft (2026-03-03)

## Levels
- Unit (core): policies/calculators/transitions (быстро, без БД).
- Integration: миграции + seed + use-cases на реальной БД.
- Contract: runtime-валидация DTO/ошибок и совместимость схем.
- E2E: Playwright golden flows (минимум, только критичное).

## Completion rule
- Фича не считается закрытой, пока не пройдены **два независимых гейта**:
  1) code-quality checks (`lint` + `typecheck` + `test`, и `build` там, где это применимо),
  2) приемочный сценарий фичи (`Acceptance (auto)` в FT-документе) после реализации конкретной фичи.
- Оба гейта обязательны для каждого FT; прохождение только одного из них не является завершением фичи.
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

## Mandatory checks sequence (per FT)
1) Реализовать код фичи и добавить/обновить тесты по policy уровня.
2) Запустить code-quality checks (`lint` + `typecheck` + `test`; при необходимости `build`).
3) Отдельно прогнать приемочный сценарий фичи (`Acceptance (auto)`), затем связанные GS (если указаны в verification matrix).
4) Зафиксировать evidence обоих этапов:
   - в feature doc: `Quality checks evidence` и `Acceptance evidence`,
   - в verification matrix: `quality_gate` и `acceptance_gate`.

## Deployed-environment smoke (beta)
- Локальные unit/integration/e2e тесты не гарантируют, что фича работает на реальном `beta` окружении (возможны drift по env/DB/deploy).
- Для user-facing auth/tenant путей (минимум: `/auth/*`, `/select-company`) обязателен отдельный beta-smoke прогон.
- Автоматизация: GitHub workflow `.github/workflows/beta-smoke.yml` + Playwright smoke spec `apps/web/playwright/tests/smoke/select-company-beta.spec.ts`.
- Smoke использует `BETA_SMOKE_USER_ID` и проверяет runtime сценарий именно на `https://beta.go360go.ru`.

Примечание:
- Для infra/docs-only фич, где нет кодовых изменений, `Quality checks evidence` допускается как `N/A` с обоснованием; acceptance/evidence при этом остаются обязательными.

## Seeds
Seeds — часть тестового контракта:
- seed scenario создаёт состояние и возвращает `handles -> ids`,
- тесты не хардкодят числовые id.

Ссылки (аннотированные):
- [Seed scenarios](../testing/seed-scenarios.md) — правила seed и стартовый набор сценариев. Читать, чтобы тесты были детерминированными и воспроизводимыми.
- [Golden scenarios](../testing/golden-scenarios.md) — каноничные сквозные сценарии. Читать, чтобы e2e покрывал основные риски минимальным набором тестов.
