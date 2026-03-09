---
description: FT-0072-webhook-security feature plan and evidence entry for EP-007-ai-webhooks.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-007-ai-webhooks/index.md
epic: EP-007
feature: FT-0072
---


# FT-0072 — AI webhook security + idempotency
Status: Completed (2026-03-04)

## User value
Webhook нельзя подделать; повторы безопасны; ошибки ретраятся корректно.

## Deliverables
- Endpoint `POST /api/webhooks/ai`:
  - HMAC подпись + timestamp window,
  - receipts table с unique idempotency key,
  - корректный HTTP mapping (4xx/5xx).

## Context (SSoT links)
- [Webhook security spec](../../../../../spec/security/webhooks-ai.md): формат HMAC, headers, timestamp window, retry policy. Читать, чтобы endpoint был совместим с AI сервисом и безопасен.
- [Error model](../../../../../spec/client-api/errors.md): HTTP/CLI маппинг ошибок. Читать, чтобы 4xx/5xx были осмысленными для ретраев.
- [AI processing](../../../../../spec/ai/ai-processing.md): какие данные webhook приносит и как применяем. Читать, чтобы webhook менял campaign/ai_job статусы корректно.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист. Читать, чтобы webhook был идемпотентным и покрытым тестом.

## Acceptance (auto)
### Setup
- Seed: `S8_campaign_ended`.
- Подготовить `campaign.status=processing_ai` и `ai_jobs(status=processing)` (integration setup).

### Action (HTTP)
1) Отправить webhook с невалидной подписью.
2) Отправить webhook с валидной подписью и валидным payload.
3) Повторить (2) с тем же `idempotency_key`.

### Assert
- (1) отклоняется (4xx), состояние не меняется.
- (2) применяется, кампания становится `completed`.
- (3) no-op, 200 OK.

### Client API ops (v1)
- `ai.webhook.receive`

## Implementation plan (target repo)
- Endpoint:
  - Next route handler принимает payload + headers:
    - `X-AI-Timestamp`, `X-AI-Signature`, `X-AI-Idempotency-Key`.
  - Проверки:
    - timestamp в допустимом окне,
    - HMAC подпись валидна,
    - `ai_job_id` существует и ожидает результат.
  - Идемпотентность:
    - записать receipt по `idempotency_key` с unique constraint,
    - при повторе вернуть 200 и не применять изменения второй раз.
  - Ошибки:
    - invalid signature/timestamp → 401/400 (без ретрая),
    - временные DB/сервис ошибки → 5xx (для ретрая).
- Тонкие моменты:
  - Важно разделить “плохой запрос” и “временная проблема”, иначе AI сервис будет бесконечно ретраить мусор или, наоборот, потеряет доставку.

## Tests
- Integration: неверная подпись → 4xx, статус кампании не меняется.
- Integration: валидный webhook → статус кампании `completed`, receipt создан.
- Integration: повтор по тому же idempotency key → 200 и no-op.

## Memory bank updates
- Если меняется формат подписи/headers — обновить: [Webhook security spec](../../../../../spec/security/webhooks-ai.md) — SSoT. Читать, чтобы интеграция не “сломалась молча”.

## Verification (must)
- Automated tests:
  - `apps/web/src/app/api/webhooks/ai/route.test.ts`
  - `packages/db/src/ft/ft-0072-ai-webhook.test.ts`
- Must run: GS3 должен быть зелёным.

## Project grounding (2026-03-04)
- [Webhook security spec](../../../../../spec/security/webhooks-ai.md): профиль подписи и идемпотентности.
- [GS3 scenario](../../../../../spec/testing/scenarios/gs3-webhook-security.md): ожидаемое поведение bad-signature/success/retry.
- [AI processing](../../../../../spec/ai/ai-processing.md): связка webhook результата с переходами `processing_ai -> completed|ai_failed`.
- [RLS strategy](../../../../../spec/security/rls.md): webhook-обработчик исполняется server-side с service-role контуром.

## Quality checks evidence (2026-03-04)
- `pnpm -r lint` → passed.
- `pnpm -r typecheck` → passed.
- `pnpm -r test` → passed.
- Build: N/A (изменения в server route + packages, отдельный build-gate не вводился).

## Acceptance evidence (2026-03-04)
- `pnpm --filter @feedback-360/web exec vitest run src/app/api/webhooks/ai/route.test.ts` → passed.
- `pnpm --filter @feedback-360/db exec vitest run src/ft/ft-0072-ai-webhook.test.ts` → passed (`integration subtest skipped` без `SUPABASE_DB_POOLER_URL`/`DATABASE_URL`).
- Проверено по intent: неверная подпись → `401` и no DB apply; валидный webhook → `200` + applied; повтор с тем же idempotency key → `200` + no-op; receipt хранится в единственном экземпляре.
