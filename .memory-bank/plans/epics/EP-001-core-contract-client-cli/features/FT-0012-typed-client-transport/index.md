# FT-0012 — Typed client transport (HTTP + in-proc)
Status: Draft (2026-03-03)

## User value
UI и CLI вызывают одни и те же операции; тесты могут вызывать операции in-proc без сети, поведение не расходится.

## Deliverables
- Typed client с режимами:
  - HTTP transport (route handlers)
  - in-proc transport (integration tests / CLI dev mode)
- Единый слой auth/tenancy контекста (active company selection).

## Context (SSoT links)
- [Client transport](../../../../../spec/client-api/transport.md): ожидания к HTTP/in-proc и где живёт auth контекст. Читать, чтобы транспорта было два, а поведение — одно.
- [Auth & tenancy](../../../../../spec/client-api/auth-and-tenancy.md): active company и membership правила. Читать, чтобы `company use` не превращался в серверное состояние.
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): список ops, включая `system.ping` и `client.setActiveCompany`. Читать, чтобы клиент не добавлял “скрытых” вызовов.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист реализации. Читать, чтобы transport был покрыт тестами и не расходился с контрактом.

## Acceptance (auto)
### Setup
- Seed: `S1_company_min`.

### Action
1) Вызвать `system.ping` через HTTP transport клиента.
2) Вызвать `system.ping` через in-proc transport клиента.
3) Вызвать `client.setActiveCompany(<company_id>)`.
4) Выполнить любой ops-вызов через оба транспорта и проверить, что active company контекст передаётся одинаково (через envelope/header/context в adapter layer).
5) Проверить, что `client.setActiveCompany` — client-local операция (без сетевого вызова).

### Assert
- Оба ответа валидируются одинаковой схемой и эквивалентны по данным.
- Ошибки (если возникают) имеют одинаковый shape и коды.
- После (3) active company сохранена в клиентском контексте.
- После (4) оба транспорта видят одинаковый active company context.
- После (5) transport spy не фиксирует сетевого вызова на `client.setActiveCompany`.

### Client API ops (v1)
- `system.ping`
- `client.setActiveCompany`

## Implementation plan (target repo)
- `packages/client`:
  - Определить интерфейс `Transport` (например `invoke(op, input)`), который возвращает typed результат/ошибку.
  - Реализовать `HttpTransport` (fetch к Next route handlers) и `InProcTransport` (прямой вызов “operation handlers” без сети).
  - Реализовать client-local состояние active company (например in-memory + optional persistence для CLI), операция `client.setActiveCompany` не ходит в сеть.
- `packages/api-contract`:
  - Добавить `system.ping` (минимальная операция для проверки транспорта) и зафиксировать output shape.
- Тонкие моменты:
  - Не смешивать concerns: transport отвечает только за доставку/парсинг, а не за RBAC или доменные правила.
  - Для in-proc важно вызывать тот же код обработки, что и HTTP (один dispatcher), иначе поведение может разойтись.

## Tests
- Integration: сравнение `system.ping` HTTP vs in-proc (эквивалентность данных).
- Unit: сериализация/десериализация ошибок одинакова для обоих транспортов.
- Unit/Integration: `client.setActiveCompany` обновляет client-local контекст и не вызывает transport.
- Integration: active company context propagation parity (HTTP vs in-proc).

## Memory bank updates
- Если меняется модель active company/контекста — обновить: [Auth & tenancy](../../../../../spec/client-api/auth-and-tenancy.md) — SSoT правил. Читать, чтобы UI/CLI были консистентны.

## Verification (must)
- Automated test: `packages/client/test/ft/ft-0012-transport-parity.test.ts` (integration) проверяет parity `system.ping` (HTTP vs in-proc).
- Automated test: `packages/client/test/ft/ft-0012-active-company-context.test.ts` (unit/integration) проверяет client-local set + parity propagation.
- Must run: FT-0012 parity тест + `pnpm -r test`.

## Visual evidence guidance
- Скриншоты опциональны: ключевая проверка фичи должна подтверждаться тестами parity/context.
- Если прикладываем визуализацию, достаточно 1 скрина/сниппета лога с результатом parity тестов (optional).
