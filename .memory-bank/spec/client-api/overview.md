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

