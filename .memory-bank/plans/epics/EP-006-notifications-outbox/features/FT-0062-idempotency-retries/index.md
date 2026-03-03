# FT-0062 — Notification idempotency + retries
Status: Draft (2026-03-03)

## User value
Система не отправляет дубликаты и корректно ретраит ошибки.

## Deliverables
- Idempotency key policy (см. spec).
- Retry policy: max attempts + backoff + dead_letter.

## Context (SSoT links)
- [Outbox & retries](../../../../../spec/notifications/outbox-and-retries.md): SSoT idempotency keys, backoff и DLQ. Читать, чтобы реализация ретраев была согласованной.
- [Notifications spec](../../../../../spec/notifications/notifications.md): какие уведомления есть и как часто. Читать, чтобы idempotency ключи соответствовали событию/адресату.
- [Error model](../../../../../spec/client-api/errors.md): как выражаем transient ошибки vs domain ошибки наружу (для CLI/ops). Читать, чтобы ошибки не “растворялись” в human output.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист. Читать, чтобы ретраи были покрыты тестом.

## Acceptance (auto)
### Setup
- Seed: `S5_campaign_started_no_answers --json` → `handles.campaign.main`

### Action (CLI, `--json`)
1) `reminders generate --campaign <handles.campaign.main> --json`
2) повторить (1)
3) `notifications dispatch --json` (в тесте Resend мок: первый раз 500, затем 200)

### Assert
- Outbox не содержит дублей (idempotency key).
- После ретрая сообщение становится `sent` (без повторного создания новых outbox записей).

### Client API ops (v1)
- `notifications.generateReminders`
- `notifications.dispatchOutbox`

## Implementation plan (target repo)
- Idempotency:
  - В `notifications.generateReminders` вычислять `idempotency_key` на “(campaign, employee, template_key, logical_time_bucket)”.
  - На уровне БД обеспечить unique по `idempotency_key` (или по набору полей).
- Retries:
  - `max_attempts` (например 10), backoff (exp до 24ч), затем `dead_letter`.
  - Transient provider errors → retry; permanent → `failed` без бесконечных попыток.
- Тонкие моменты:
  - Повторный `reminders generate` не должен создавать дубли.
  - Retried send не должен менять `idempotency_key` (иначе появится дубль).

## Tests
- Integration: дважды `generateReminders` → количество outbox записей не растёт.
- Integration: мок Resend “500 затем 200” → одна outbox запись, несколько attempts, финально `sent`.

## Memory bank updates
- При изменении формулы idempotency key обновить: [Outbox & retries](../../../../../spec/notifications/outbox-and-retries.md) — SSoT. Читать, чтобы не было дублей из-за расхождений.

## Verification (must)
- Automated test: `packages/core/test/ft/ft-0062-idempotency-retries.test.ts` (integration) повторяет Acceptance и мокает “500 затем 200”.
- Must run: GS7 должен быть зелёным.
