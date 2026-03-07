# Implementation playbook (vertical slice → code)
Status: Updated (2026-03-06)

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
`Project grounding` обязателен и фиксируется в FT-документе (см. шаблон фичи).
1) Открыть FT-документ фичи: acceptance (Setup/Action/Assert), ops, seeds.
2) Открыть связанные SSoT документы из `## Context` в FT (domain/security/notifications/...).
   - Для UI polish/refactor фич дополнительно обязательно открыть:
     - [UI design system](../spec/ui/design-system/index.md): tokens, patterns и sync policy. Читать, чтобы визуальные изменения шли через систему, а не через локальные patch-и.
     - [Screen registry](../spec/ui/screen-registry.md): канонические `screen_id` и `testIdScope`. Читать, чтобы новые screens/screenshots/selectors были traceable.
     - [Screen-by-screen redesign](../spec/ui/screen-by-screen-redesign.md): agreed audit по текущим surfaces. Читать, чтобы UI changes опирались на уже собранный экранный контекст.
3) Проверить каталоги:
   - [Operation catalog](../spec/client-api/operation-catalog.md): SSoT списка операций. Читать, чтобы не добавлять “скрытые” вызовы.
   - [CLI command catalog](../spec/cli/command-catalog.md): 1:1 команда → операция. Читать, чтобы CLI не содержал доменной логики.
   - [Traceability](../spec/testing/traceability.md): инвариант → тест → seed. Читать, чтобы не потерять ключевые требования.
4) Зафиксировать в FT, какие именно документы прочитаны и какие слои/файлы будут затронуты (contract/core/db/client/cli/tests/docs).

## 1) Contract: операция, DTO, ошибки (SSoT)
Target files (текущее target-состояние):
- `packages/api-contract/src/<area>.ts` — feature-area public exports для операций/DTO/errors.
- `packages/api-contract/src/index.ts` — aggregate export surface.
- `packages/api-contract/src/v1/legacy.ts` — transitional runtime schema/storage layer, пока deeper internal split не завершён.

Checklist:
- Добавить/обновить операцию в каталоге (и в контракте).
- Схемы должны быть strict (не “съедать” неизвестные поля).
- Ошибки наружу только typed (`code/message/details`), без “сырых” исключений.

## 2) Core: use-case + policy + инварианты
Target files (текущее target-состояние):
- `packages/core/src/features/<area>.ts`
- `packages/core/src/shared/*` (только для truly shared helpers)
- `packages/core/src/index.ts` (composition/dispatch only)

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
Target files (текущее target-состояние):
- `packages/client/src/features/<area>.ts`
- `packages/client/src/shared/runtime.ts`
- `packages/client/src/index.ts`

Checklist:
- Один контракт для HTTP/in-proc (одинаковые DTO/ошибки).
- У клиента нет “скрытых” бизнес-правил: только вызов операции и парсинг ответа.

## 6) CLI: команда 1:1 к операции
Target files (текущее target-состояние):
- `packages/cli/src/index.ts` — thin entrypoint.
- `packages/cli/src/legacy.ts` — transitional command registry until deeper CLI split.
- `packages/cli/src/formatters/*` (human и `--json`) — when introduced, без доменной логики.

Checklist:
- CLI по умолчанию human, `--json` отдаёт стабильную схему.
- Команда не содержит доменных правил — только сбор аргументов и вызов операции.
- Новый command behavior добавляем рядом с owning feature-area surface и не размазываем по `legacy.ts` без плана последующего выноса.

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
- Для material UI changes:
  - `spec/ui/design-system/*`: если менялись tokens, semantic statuses или repeated UI patterns;
  - `spec/ui/screens/*`: если изменился contract конкретного экрана;
  - guides/tutorial screenshots/evidence: если существующие изображения перестали отражать актуальный UI.
