# Implementation playbook (vertical slice → code)
Status: Draft (2026-03-03)

Цель: единообразно превращать план фичи (FT-*) в реализацию в коде, так чтобы:
- UI/CLI оставались “тонкими”,
- typed contract/client был стабильным контрактом,
- поведение подтверждалось seeds + acceptance сценариями + тестами,
- изменения документации были синхронизированы (без дублирования кода).

Ссылки (аннотированные):
- [Repo structure (target)](../spec/project/repo-structure.md): целевая структура `apps/` и `packages/`. Читать, чтобы называть файлы/папки последовательно и не “перекладывать” проект позже.
- [Layers & vertical slices](../spec/project/layers-and-vertical-slices.md): определение vertical slice и DoD фичи. Читать, чтобы каждая фича приносила работающий “сквозной” кусок.
- [Architecture guardrails](../spec/engineering/architecture-guardrails.md): запреты на импорт core в UI/CLI и прочие границы слоёв. Читать, чтобы не допустить “утечку логики” в клиентов.
- [Coding style](../spec/engineering/coding-style.md): базовые соглашения (TS, Biome, ошибки). Читать, чтобы код и CLI были предсказуемыми.
- [Testing standards](../spec/engineering/testing-standards.md): уровни тестов и как покрываем инварианты. Читать, чтобы новые фичи сразу были проверяемыми.
- [Documentation standards](../spec/engineering/documentation-standards.md): правила меморибанка и аннотированных ссылок. Читать, чтобы документация оставалась SSoT и не расползалась.

## 0) Перед началом фичи: собрать контекст
1) Открыть FT-документ фичи: acceptance (Setup/Action/Assert), ops, seeds.
2) Открыть связанные SSoT документы из `## Context` в FT (domain/security/notifications/...).
3) Проверить каталоги:
   - [Operation catalog](../spec/client-api/operation-catalog.md): SSoT списка операций. Читать, чтобы не добавлять “скрытые” вызовы.
   - [CLI command catalog](../spec/cli/command-catalog.md): 1:1 команда → операция. Читать, чтобы CLI не содержал доменной логики.
   - [Traceability](../spec/testing/traceability.md): инвариант → тест → seed. Читать, чтобы не потерять ключевые требования.

## 1) Contract: операция, DTO, ошибки (SSoT)
Target files (примерно, будем уточнять после scaffold):
- `packages/api-contract/src/v1/<slice>/ops.ts` — объявление операций (имя, input/output/error).
- `packages/api-contract/src/v1/<slice>/schemas.ts` — runtime-схемы (zod/valibot).
- `packages/api-contract/src/v1/errors.ts` — общий список error codes (если расширяем).

Checklist:
- Добавить/обновить операцию в каталоге (и в контракте).
- Схемы должны быть strict (не “съедать” неизвестные поля).
- Ошибки наружу только typed (`code/message/details`), без “сырых” исключений.

## 2) Core: use-case + policy + инварианты
Target files (примерно):
- `packages/core/src/slices/<slice>/use-cases/<op>.ts`
- `packages/core/src/slices/<slice>/policies/*.ts` (если нужна политика)
- `packages/core/src/errors/*` (если добавляем доменный error code)
- `packages/core/src/ports/*` (если нужна внешняя зависимость)

Checklist:
- Инварианты (lock/анонимность/переходы статусов) — только в core.
- Use-case атомарный: или всё применилось, или ничего (без “частичных” изменений).
- Переиспользовать политики из spec, а не дублировать правила в клиентах.

## 3) Data/DB: Drizzle schema + миграции + RLS
Target files (примерно):
- `packages/db/src/schema/*.ts`
- `packages/db/src/migrations/*`
- `packages/db/src/rls/*` (если политики храним рядом)

Checklist:
- `company_id` присутствует почти везде (multi-tenant).
- Soft delete / history — по spec, где нужно (не удаляем физически “важные” записи).
- RLS “deny-by-default”: тестировать отдельным smoke (GS10).

## 4) Adapters: HTTP handlers, auth, providers
Target files (примерно):
- `apps/web/src/app/api/<slice>/<op>/route.ts` (Next route handler)
- `apps/web/src/server/*` (db/auth/outbox/webhook adapters)

Checklist:
- Handler валидирует input по contract, затем вызывает core use-case.
- Auth/RBAC проверяем до бизнес-логики (но доменные инварианты всё равно в core).

## 5) Typed client: транспорт + удобные методы
Target files (примерно):
- `packages/client/src/http/*` (fetch adapter)
- `packages/client/src/inproc/*` (если используем)
- `packages/client/src/index.ts` (экспорт методов)

Checklist:
- Один контракт для HTTP/in-proc (одинаковые DTO/ошибки).
- У клиента нет “скрытых” бизнес-правил: только вызов операции и парсинг ответа.

## 6) CLI: команда 1:1 к операции
Target files (примерно):
- `packages/cli/src/commands/<slice>/<command>.ts`
- `packages/cli/src/formatters/*` (human и `--json`)

Checklist:
- CLI по умолчанию human, `--json` отдаёт стабильную схему.
- Команда не содержит доменных правил — только сбор аргументов и вызов операции.

## 7) Tests: от инварианта к уровню
Минимум:
- Unit: политики/расчёты/state machine (быстро, без БД).
- Integration: use-case + реальная БД (локальная supabase), миграции, RLS smoke при необходимости.
- Contract: схемы DTO + примеры (golden payloads).
- E2E: Playwright только для “сквозного” пути (GS1) и пары критичных edge cases.

Сценарии и seeds:
- Использовать seeds из каталога и **handles** вместо “id=1”.
- Если нужен edge case — добавить seed **variant** (см. ниже), а не “ручные апдейты” в тесте.

## 7.1) Code checks (must) — отдельный quality gate
Перед выполнением приемочного сценария FT обязательно:
1) Убедиться, что добавлены/обновлены тесты по policy проекта.
2) Прогнать quality checks:
   - `pnpm -r lint`
   - `pnpm -r typecheck`
   - `pnpm -r test`
   - `build` для затронутых частей, где есть сборка.
3) Если quality checks не зелёные — фича не переходит к acceptance gate.

## 7.2) Acceptance verification (must) — как закрываем фичу
Перед тем как считать FT “готовой”, обязательно (после 7.1):
1) Реализовать automated test, который повторяет `## Acceptance (auto)` из FT-документа:
   - для большинства фич это Vitest integration/unit тест (см. [Testing standards](../spec/engineering/testing-standards.md): где класть FT/GS тесты и как их называть). Читать, чтобы тесты были запускаемыми ИИ-агентом по соглашению.
2) Если фича участвует в golden сценарии GS*, обеспечить автоматическую проверку этого GS:
   - либо через Vitest (без UI),
   - либо через Playwright (если нужен UI).
3) Отдельно прогнать приемочный сценарий текущей фичи (по её FT-документу), а затем обязательные GS.
4) Записать execution evidence в [Verification matrix](verification-matrix.md) и положить ссылку на evidence в PR (правила PR/evidence — в [Git flow](../spec/operations/git-flow.md)).
5) Обновить сам FT-документ:
   - заполнить `Quality checks evidence (YYYY-MM-DD)`,
   - заполнить `Acceptance evidence (YYYY-MM-DD)`.

## 8) Seed variants (детерминированно)
Рекомендуемый контракт:
- `seed.run` принимает `scenario` и опционально `variant`.
- CLI: `seed --scenario <Sx> [--variant <name>] --json`.
- Документировать варианты в seed-документе (`## Variants`) и в golden-сценарии.

## 9) Memory bank updates (по итогу реализации)
После реализации фичи (или эпика) обновить документы:
- FT-документ: статус + любые корректировки acceptance.
- `spec/*`: если изменились правила/интерфейсы (SSoT), обновить и добавить ссылки на rationale/ADR при необходимости.
- `spec/client-api/*`: operation/command catalogs синхронизировать с кодом.
- `spec/testing/*`: traceability (инвариант → тест → seed), seed docs и сценарии.
- `plans/verification-matrix.md`: evidence по затронутому EP/FT.
- `adr/*`: если принято новое существенное решение (WHY), зафиксировать в ADR.
