# FT-0062 — Notification idempotency + retries
Status: Completed (2026-03-05)

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

### Action (integration, auto)
1) `notifications.generateReminders` дважды для одного campaign/day.
2) В outbox payload проставить stub-флаг `__stubFailUntilAttempt=1`.
3) `notifications.dispatchOutbox`:
   - первый вызов получает transient failure → retry scheduled;
   - второй вызов до `next_retry_at` ничего не обрабатывает;
   - после принудительного сдвига `next_retry_at` в прошлое повторный dispatch отправляет запись в `sent`.

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
- Automated test: `packages/core/src/ft/ft-0062-idempotency-retries.test.ts` (integration) повторяет Acceptance и проверяет retry/backoff поведение.
- Must run: GS7 (часть idempotency/retries) зелёная; timezone/quiet-hours закрываются FT-0063.

## Execution evidence (2026-03-05)
- `pnpm --filter @feedback-360/db lint && pnpm --filter @feedback-360/db typecheck` → passed.
- `pnpm --filter @feedback-360/core lint && pnpm --filter @feedback-360/core typecheck` → passed.
- `set -a; source .env; set +a; pnpm db:migrate` → passed.
- `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0062-idempotency-retries.test.ts` → passed.
- Regression:
  - `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0061-outbox-dispatch.test.ts` → passed.
  - `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts` → passed.
  - `pnpm --filter @feedback-360/client exec vitest run src/ft-0061-notifications-client.test.ts` → passed.
  - `pnpm --filter @feedback-360/cli exec vitest run src/ft-0061-notifications-cli.test.ts` → passed.
