# GS3 — Webhook security & idempotency
Status: Draft (2026-03-03)

## Setup
- Seed: `S8_campaign_ended` (campaign ready for AI)
- Подготовить pending AI job: `campaign.status=processing_ai`, `ai_jobs.status=processing` (через setup-helper/fixture).

## Action
1) Webhook с неверной подписью.
2) Webhook с верной подписью (success payload).
3) Повтор webhook с тем же `idempotency_key`.

## Assertions
- Неверная подпись → 401/403 (4xx) и состояние не меняется.
- Успех переводит кампанию в `completed`.
- Повтор → 200 и no-op (idempotent).

## Client API ops (v1)
- `ai.webhook.receive`

## CLI example
- CLI здесь не обязателен: тестируем server endpoint напрямую (HTTP) с разными подписями.
