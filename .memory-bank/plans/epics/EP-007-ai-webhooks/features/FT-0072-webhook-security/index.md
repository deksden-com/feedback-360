# FT-0072 — AI webhook security + idempotency
Status: Draft (2026-03-03)

## User value
Webhook нельзя подделать; повторы безопасны; ошибки ретраятся корректно.

## Deliverables
- Endpoint `ai.webhook.receive`:
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
- Seed: `S8_campaign_ended` + запуск `ai run` → campaign в `processing_ai`, известен `ai_job_id`.

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
    - `X-Timestamp`, `X-Signature`, `X-Idempotency-Key` (или вычисляем).
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
- Automated test: `apps/web/test/ft/ft-0072-webhook-security.test.ts` (integration) повторяет Acceptance (bad signature, good payload, idempotent repeat).
- Must run: GS3 должен быть зелёным.
