# FT-0063 — Scheduling (timezone + quiet hours)
Status: Completed (2026-03-05)

## User value
Напоминания приходят “в рабочее время” компании и с корректной частотой.

## Deliverables
- Вычисление “пора слать” на основе:
  - `companies.timezone` + override кампании,
  - quiet hours 08:00–20:00,
  - расписание 3×/нед (default).

## Context (SSoT links)
- [Notifications spec](../../../../../spec/notifications/notifications.md): расписания reminders и “когда слать”. Читать, чтобы planner соответствовал продуктовым ожиданиям.
- [Outbox & retries](../../../../../spec/notifications/outbox-and-retries.md): idempotency и генерация outbox. Читать, чтобы scheduler не генерировал дубли при повторном cron.
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): status/ended и end_at. Читать, чтобы reminders не генерировались после дедлайна.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист. Читать, чтобы planner был unit-тестируемым (Clock port).

## Acceptance (auto)
### Setup
- Seed: `S5_campaign_started_no_answers` с:
  - company timezone,
  - campaign timezone override.

### Action (unit/integration test)
1) Прогнать “reminder planner” на наборах `now` (поддельные времена) в разных таймзонах.

### Assert
- Вне quiet hours reminders не генерируются.
- Внутри quiet hours reminders генерируются согласно расписанию (default 3×/нед).

## Implementation plan (target repo)
- Core (planner):
  - Вынести вычисление “should_generate_reminders(now, campaign, rules)” в чистую функцию (unit-testable).
  - Учитывать timezone:
    - если у кампании override — использовать его,
    - иначе `companies.timezone`.
  - Quiet hours:
    - по умолчанию 08:00–20:00 local time компании (MVP фиксировано).
  - Default schedule:
    - 3×/нед (например Пн/Ср/Пт в 10:00 local), сохраняем как part of campaign settings.
- Adapter (cron):
  - Cron вызывает `notifications.generateReminders` только когда planner говорит “пора”.
- Тонкие моменты:
  - Чтобы не было дублей, planner + idempotency key должны работать вместе (см. FT-0062).

## Tests
- Unit: наборы `now` в разных timezone → should/not generate.
- Integration: cron-like вызовы не создают outbox вне quiet hours.

## Memory bank updates
- При изменении default расписания/quiet hours обновить: [Notifications spec](../../../../../spec/notifications/notifications.md) — SSoT. Читать, чтобы ожидания продукта и cron совпадали.

## Verification (must)
- Automated test: `packages/core/src/ft/ft-0063-scheduling.test.ts` (unit+integration) прогоняет planner по фиктивным `now` в разных timezone.
- Must run: `pnpm -r test` + набор кейсов quiet hours.

## Execution evidence (2026-03-05)
- `pnpm --filter @feedback-360/api-contract lint && pnpm --filter @feedback-360/api-contract typecheck` → passed.
- `pnpm --filter @feedback-360/db lint && pnpm --filter @feedback-360/db typecheck` → passed.
- `pnpm --filter @feedback-360/core lint && pnpm --filter @feedback-360/core typecheck` → passed.
- `pnpm --filter @feedback-360/client typecheck` → passed.
- `pnpm --filter @feedback-360/cli lint && pnpm --filter @feedback-360/cli typecheck` → passed.
- `set -a; source .env; set +a; pnpm db:migrate` → passed.
- `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0061-outbox-dispatch.test.ts src/ft/ft-0062-idempotency-retries.test.ts src/ft/ft-0063-scheduling.test.ts --fileParallelism=false` → passed.
- `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts` → passed.
- `pnpm --filter @feedback-360/client exec vitest run src/ft-0061-notifications-client.test.ts` → passed.
- `pnpm --filter @feedback-360/cli exec vitest run src/ft-0061-notifications-cli.test.ts` → passed.
