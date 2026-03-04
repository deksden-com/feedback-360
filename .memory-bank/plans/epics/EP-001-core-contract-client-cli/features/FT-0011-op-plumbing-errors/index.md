# FT-0011 — Operation plumbing + typed errors
Status: Draft (2026-03-03)

## User value
Любая операция (UI/CLI/tests) имеет единый shape input/output/error, ошибки машиночитаемы и стабильны.

## Deliverables
- Contract: error shape `code/message/details` как SSoT.
- Runtime-валидация DTO (input/output) на границе операции.
- Базовый рантайм для операций v1 (router/dispatcher).

## Context (SSoT links)
- [Operations spec](../../../../../spec/client-api/operations.md): конвенции именования/версирования операций. Читать, чтобы “router” не превратился в отдельный API-слой со своей логикой.
- [Error model](../../../../../spec/client-api/errors.md): shape ошибок и маппинг на HTTP/CLI. Читать, чтобы tests проверяли контракт, а не случайный формат.
- [CLI spec](../../../../../spec/cli/cli.md): требования к `--json` формату и exit codes. Читать, чтобы CLI был AI-friendly.
- [Architecture guardrails](../../../../../spec/engineering/architecture-guardrails.md): границы слоёв. Читать, чтобы operations plumbing не протёк в UI/CLI.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист “FT → код”. Читать, чтобы не забыть contract/core/tests/cli.

## Acceptance (auto)
### Setup
- Seed: `S1_company_min` (для контекста компании/пользователя).

### Action (integration test)
1) Вызвать любую operation handler функцию с невалидным input (schema violation).
2) Вызвать write-операцию в контексте роли без прав (RBAC).
3) Вызвать operation dispatcher с валидной operation и валидным input (happy-path через роутер/диспетчер).
4) Вызвать operation dispatcher с неизвестной operation.

### Assert
- (1) возвращает error shape `{"code","message","details"}` и `code=invalid_input` (или согласованный эквивалент).
- (2) возвращает `code=forbidden`.
- (3) возвращает `ok=true` и output, прошедший runtime-валидацию output schema.
- (4) возвращает typed error (`code=not_found` или согласованный `operation_not_found` в рамках Error model).
- При вызове через CLI с `--json`: печатается `{"ok":false,"error":{...}}` и `exitCode != 0`.

## Implementation plan (target repo)
- Contract:
  - Зафиксировать общий `Result`/error shape для всех ops (успех vs typed error).
  - Добавить единый список базовых error codes (минимум `invalid_input`, `unauthenticated`, `forbidden`, `not_found`).
- Web adapter:
  - Сделать “operation dispatcher” для `/api/v1/<op>` (или эквивалент), который:
    - валидирует input по runtime-схеме,
    - собирает auth/tenancy контекст,
    - вызывает core use-case,
    - сериализует typed error в HTTP ответ.
- CLI adapter:
  - Утвердить формат: при `--json` CLI печатает только `{ok:true,data}` или `{ok:false,error}` и завершает процесс с кодом ошибки.
- Тонкие моменты:
  - Ошибка RBAC (`forbidden`) и “не найдено” (`not_found`) должны быть различимы и консистентны между HTTP/in-proc/CLI.
  - Не возвращать stack traces/сырые ошибки в `message` (только в logs).

## Tests
- Contract: тесты runtime-схем (невалидный input → `invalid_input`).
- Integration: запрет по RBAC → `forbidden` (под role без прав).
- Integration: dispatcher happy-path/unknown-op (typed response в обоих кейсах).
- CLI: snapshot тест `--json` ошибки (shape стабильный).

## Memory bank updates
- При добавлении/изменении базовых error codes синхронизировать: [Error model](../../../../../spec/client-api/errors.md) — SSoT кодов/shape. Читать, чтобы acceptance тесты ссылались на единые `code`.

## Verification (must)
- Automated test: `packages/core/test/ft/ft-0011-op-errors.test.ts` (integration) повторяет Acceptance: invalid input → `invalid_input`, RBAC → `forbidden`, `--json` shape.
- Must run: `pnpm -r test` (и отдельный запуск теста FT-0011 по имени файла/теста).

## Visual evidence guidance
- Для этой фичи скриншоты не обязательны: основное доказательство — автоматические тесты и JSON/error shape.
- Если нужно для ревью, можно приложить 1 скрин terminal-вывода `--json` ошибки (optional).
