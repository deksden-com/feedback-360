---
description: FT-0064-campaign-invites feature plan and evidence entry for EP-006-notifications-outbox.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-006-notifications-outbox/index.md
epic: EP-006
feature: FT-0064
---


# FT-0064 — Campaign start invites (magic link emails)
Status: Completed (2026-03-05)

## User value
Сотрудники и оценщики автоматически получают письмо с magic link при старте кампании и могут сразу войти и заполнить анкеты.

## Deliverables
- При `campaign.start` (или сразу после) создаются outbox записи события `campaign_invite` для всех включённых в кампанию сотрудников/оценщиков (email-only MVP).
- Idempotency: повторный `campaign.start` / ретрай не создаёт дублей invite-уведомлений.
- Template RU v1: `campaign_invite` (magic link внутри).

## Context (SSoT links)
- [Notification spec](../../../../../spec/notifications/notifications.md): событие `campaign_invite` и содержимое invite. Читать, чтобы триггер и payload были согласованы с продуктом.
- [Outbox & retries](../../../../../spec/notifications/outbox-and-retries.md): outbox schema и идемпотентность. Читать, чтобы invites не дублировались при ретраях.
- [Auth & identity](../../../../../spec/security/auth-and-identity.md): users pre-created, signups off, magic link как вход. Читать, чтобы invite не превращался в “публичную регистрацию”.
- [Templates RU v1](../../../../../spec/notifications/templates-ru-v1.md): каталог шаблонов. Читать, чтобы добавить ключ/переменные без хаоса.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист “FT → код”. Читать, чтобы связать campaign.start → outbox → dispatcher → tests.

## Acceptance (auto)
### Setup
- Seed: `S4_campaign_draft --json` → `handles.campaign.main`

### Action (integration test)
1) Вызвать `campaign.start` (HR Admin).
2) Проверить, что в `notification_outbox` появились invite-записи для адресатов кампании.
3) Повторить `campaign.start` (идемпотентный повтор) или ретрай обработчика.

### Assert
- После (1): создано N outbox записей `event_type=campaign_invite` без дублей (unique по idempotency key).
- Повтор (3) не увеличивает число invite outbox записей.

### Client API ops (v1)
- `campaign.start`
- `notifications.dispatchOutbox` (опционально для end-to-end теста отправки)

## Implementation plan (target repo)
- Core:
  - В `campaign.start` после успешного перехода в `started`:
    - определить получателей invite (минимум: все raters с назначенными questionnaires; или все participants — зафиксировать правило),
    - создать outbox записи `campaign_invite` с idempotency key.
- Outbox:
  - Idempotency key на “(campaign_id, event_type, recipient_employee_id)” (и/или date_bucket, если повторяем по дням).
- Dispatcher:
  - Для `campaign_invite` рендерить RU v1 template и отправлять через Resend.
- Тонкие моменты:
  - Invite должен быть безопасным при ретраях и не создавать несколько magic links “в минуту”.
  - Если пользователь/employee неактивен (`is_active=false`), invite не создаём.

## Tests
- Integration: `campaign.start` создаёт outbox invites ровно один раз.
- Integration: dispatcher отправляет invites через мок Resend и помечает outbox как `sent`.

## Memory bank updates
- При уточнении получателей invites обновить: [Notification spec](../../../../../spec/notifications/notifications.md) — SSoT триггеров. Читать, чтобы HR/employee ожидания совпадали с кодом.

## Verification (must)
- Automated test: `packages/core/src/ft/ft-0064-campaign-invites.test.ts` (integration) проверяет создание outbox invites без дублей + отправку через dispatcher.
- Must run: GS13 должен быть зелёным.

## Execution evidence (2026-03-05)
- `pnpm --filter @feedback-360/db lint && pnpm --filter @feedback-360/db typecheck` → passed.
- `pnpm --filter @feedback-360/core lint && pnpm --filter @feedback-360/core typecheck` → passed.
- `set -a; source .env; set +a; pnpm db:migrate` → passed.
- `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0061-outbox-dispatch.test.ts src/ft/ft-0062-idempotency-retries.test.ts src/ft/ft-0063-scheduling.test.ts src/ft/ft-0064-campaign-invites.test.ts --fileParallelism=false` → passed.
- `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts` → passed.
- `pnpm --filter @feedback-360/client exec vitest run src/ft-0061-notifications-client.test.ts` → passed.
- `pnpm --filter @feedback-360/cli exec vitest run src/ft-0061-notifications-cli.test.ts` → passed.
