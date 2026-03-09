# Transport: HTTP vs in-proc
Status: Draft (2026-03-03)

## HTTP
UI в production вызывает серверные route handlers через HTTP (или server actions, если будет уместно), которые затем вызывают core use-cases.

## In-proc (recommended for tests/CLI/dev)
Клиент может работать “in-proc”:
- в интеграционных тестах (без сетевого hop),
- в CLI (если запускается рядом с core и имеет доступ к server adapters),
при этом **контракт операций** остаётся тем же.

Правило: не должно быть расхождений поведения между HTTP и in-proc; HTTP — только адаптер транспорта.

## Implementation entrypoints
- `packages/client/src/index.ts`
- `packages/client/src/http/`
- `packages/client/src/inproc/`
- `apps/web/src/app/api/`

## Primary tests
- `packages/client/src/ft-0142-client-layout.test.ts`
- `packages/core/src/ft/ft-0013-questionnaires-no-db.test.ts`
