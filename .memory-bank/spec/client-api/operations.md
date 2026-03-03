# Operations spec (v1)
Status: Draft (2026-03-03)

## Versioning
- Операции лежат в `v1`.
- Любое breaking изменение создаёт `v2` (не ломаем CLI/UI “молча”).

## Operation shape (recommended)
Каждая операция — функция:
- `input`: DTO (runtime-валидируемый)
- `output`: DTO
- `error`: typed error (`code`, `message`, `details`)

## Naming convention (SSoT)
- `namespace.verbNoun` (dot-separated), например:
  - `campaign.start`, `campaign.weights.set`, `matrix.generateSuggested`.
- Для списков/получения данных используем `get/list`.
- Для “upsert” используем `upsert`, если действительно поддерживаем create+update по natural key.

## Idempotency
Для операций, которые могут ретраиться:
- поддерживаем `idempotency_key` в input,
- на сервере обеспечиваем идемпотентность (DB unique + receipts).

Критичные операции:
- запуск AI job,
- enqueue уведомлений,
- webhook receipts (обработка результата).
