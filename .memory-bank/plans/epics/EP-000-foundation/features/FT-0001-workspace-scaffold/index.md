# FT-0001 — Workspace scaffold + tooling
Status: Completed (2026-03-03)

## User value
Разработчики и агенты могут одинаково запускать форматирование/линт/тесты и получать предсказуемый результат.

## Deliverables
- Monorepo (pnpm workspace) со структурами `apps/` и `packages/`.
- Biome конфигурация, базовые npm scripts: `lint`, `format`, `typecheck`, `test`.
- Vitest базовый запуск (smoke test).
- Playwright базовый запуск (может быть пустым на старте, но инфраструктура готова).

## Context (SSoT links)
- [Stack & tooling](../../../../../spec/project/stack-and-tooling.md): целевой стек и тулчейн. Читать, чтобы scaffold не конфликтовал с agreed инструментами.
- [Repo structure (target)](../../../../../spec/project/repo-structure.md): целевая структура монорепо и границы пакетов. Читать, чтобы scaffold совпал с принятыми слоями.
- [Architecture guardrails](../../../../../spec/engineering/architecture-guardrails.md): границы между core/clients/UI. Читать, чтобы сразу поставить “рельсы” и не допустить неверных импортов.
- [Coding style](../../../../../spec/engineering/coding-style.md): стиль TS/ошибок/CLI. Читать, чтобы базовые конфиги соответствовали договорённостям.
- [Testing standards](../../../../../spec/engineering/testing-standards.md): уровни тестов и минимальные требования. Читать, чтобы smoke тесты и CI были полезными.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): чеклист “FT → код” и апдейты меморибанка. Читать, чтобы фича закрылась вертикальным слайсом и с тестами.

## Acceptance (auto)
### Setup
- Repo: чистый репозиторий.

### Action (CLI)
1) `pnpm -r lint`
2) `pnpm -r typecheck`
3) `pnpm -r test`

### Assert
- Все команды завершаются успешно.
- В CI есть job, который запускает как минимум `lint/typecheck/test`.

## Notes
- На старте важно не переусложнить: держим минимум скриптов/конфигов, но так, чтобы они масштабировались без “залипания” на инфраструктуре.

## Implementation plan (target repo)
- Workspace:
  - Создать `pnpm-workspace.yaml` и корневой `package.json` со скриптами `lint/format/typecheck/test`.
  - Создать каркас пакетов/приложения: `apps/web`, `packages/{core,api-contract,client,cli,db,testkit,config}` (пустые, но компилируемые).
- Tooling:
  - В `packages/config` положить базовые `tsconfig` и `biome` конфиги, подключить их в остальные пакеты.
  - Настроить Vitest и добавить по 1 smoke тесту (проверка запуска + типы).
  - Поднять Playwright конфигурацию в `apps/web` (без обязательных тестов на старте).
- CI:
  - Добавить workflow (например GitHub Actions), который выполняет `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`.

## Tests
- Unit: smoke тест в каждом пакете.
- CI: один job, повторяющий “Acceptance (auto)”.

## Memory bank updates
- Если структура пакетов/скриптов отличается от target — обновить: [Repo structure (target)](../../../../../spec/project/repo-structure.md) — SSoT структуры. Читать, чтобы документация не отставала от scaffold.
- Если меняется набор инструментов/настроек — обновить: [Stack & tooling](../../../../../spec/project/stack-and-tooling.md) — SSoT тулчейна. Читать, чтобы новые участники не гадали “как запускать”.

## Verification (must)
- Automated test: добавить smoke-тесты запуска (и/или “meta” тест) так, чтобы это проверялось в CI (см. `FT-0001` Acceptance).
- Must run: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` (и CI job делает то же самое).

## Implementation result (2026-03-03)
- Созданы `pnpm-workspace.yaml`, корневой `package.json`, корневой `biome.json`.
- Создан каркас `apps/web` и `packages/{config,core,api-contract,client,cli,db,testkit}` с рабочими `lint/format/typecheck/test` scripts.
- Добавлены базовые TS-конфиги в `packages/config` и smoke-тесты в каждом workspace пакете.
- Добавлены Playwright scaffold-файлы в `apps/web/playwright`.
- Добавлен CI workflow `.github/workflows/ci.yml` с шагами `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`.
- Проверка выполнена успешно локально командами:
  1) `pnpm -r lint`
  2) `pnpm -r typecheck`
  3) `pnpm -r test`

## Acceptance evidence (2026-03-04)
- Прогон `pnpm -r lint` завершён успешно для всех workspace пакетов.
- Прогон `pnpm -r typecheck` завершён успешно для всех workspace пакетов.
- Прогон `pnpm -r test` завершён успешно; в `packages/db` интеграционные `FT-0002`/`FT-0003` тоже зелёные (с `SUPABASE_DB_POOLER_URL`).
