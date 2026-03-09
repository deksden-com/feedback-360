# Typed contract + typed client — overview
Status: Draft (2026-03-03)

Зафиксированный подход: **core → typed contract → typed client → CLI first → UI**.

## Why
- Один контракт операций для UI и CLI.
- “Тонкие клиенты”: не дублируют доменные правила (анонимность/веса/lock/переходы).
- Удобная автоматизация: CLI и тесты используют те же операции, что и UI.

## What is “Client API”
Client API = набор типизированных операций v1 (request/response/error), описанных в `api-contract`, и реализация клиента `client`, которая:
- валидирует input/output по схемам,
- добавляет auth/tenancy контекст,
- доставляет вызов (HTTP или in-proc).

## Implementation entrypoints
- `packages/api-contract/src/index.ts`
- `packages/client/src/index.ts`
- `packages/cli/src/index.ts`
- `apps/web/src/features/identity-tenancy/lib/operation-context.ts`

## Primary tests
- `packages/client/src/ft-0142-client-layout.test.ts`
- `packages/api-contract/src/ft-0142-contract-layout.test.ts`
- `packages/cli/src/ft-0142-feature-area-cli-regression.test.ts`
