# AI Webhook Security Spec
Status: Draft (2026-03-03)

## Endpoint
Webhook принимается на серверной стороне (Next.js route handler):
- `POST /api/webhooks/ai`

## Identity & scoping
- Webhook всегда относится к конкретной кампании: `campaign_id`.
- Payload содержит `ai_job_id` и `campaign_id`.
- Для `status=completed` payload может включать `questionnaire_comments[]` с processed/summary patch:
  - `questionnaire_id` (preferred) или `subject_employee_id + rater_employee_id`,
  - `competency_comments.<competency_id>.processed_text`,
  - `competency_comments.<competency_id>.summary_text`.

## HMAC
MVP профиль:
- Подписываем `timestamp + "." + raw_body`.
- Заголовки:
  - `X-AI-Timestamp`: unix seconds
  - `X-AI-Signature`: `sha256=<hex>`
  - `X-AI-Idempotency-Key`: строка (уникальная для одного результата)
- Принимаем подпись только в окне clock-skew (например, 5 минут).
- Секрет подписи задаётся через `AI_WEBHOOK_SECRET` (server-only env var).

## Idempotency
- Храним `ai_webhook_receipts` с unique constraint на `idempotency_key`.
- Повторный webhook с тем же ключом возвращает 200 и не меняет состояние (no-op).

## Retry semantics
- Мы обязаны быть идемпотентными и безопасными к ретраям.
- Логируем все попытки (успех/неуспех) с `ai_job_id` и `campaign_id`.

MVP ожидания по ретраям (SSoT):
- AI сервис может ретраить доставку webhook при `5xx`/timeout.
- Мы возвращаем:
  - `2xx` только если подпись валидна и обработка идемпотентно применена (или no-op при повторе),
  - `4xx` при невалидной подписи/формате (ретраить бессмысленно),
  - `5xx` при временной ошибке (можно ретраить).

## MVP note
- В MVP действует `ai.runForCampaign` stub-профиль (FT-0071), поэтому webhook может не использоваться в ежедневном happy path.
- Endpoint и security-механика реализованы заранее (FT-0072), чтобы переход на real AI callback был без архитектурного долга.
