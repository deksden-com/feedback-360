# EP-007 — AI processing + webhook security
Status: Draft (2026-03-03)

## Goal
AI постобработка open text: job orchestration + webhook security (HMAC + idempotency) + retry.

## Features (vertical slices)
- [Feature catalog](features/index.md): список фич EP-007 с acceptance сценариями. Читать, чтобы AI интеграция была безопасной и идемпотентной.

## Scenarios / tests
- GS3 (webhook security)
- GS1 (happy path includes AI)

## Progress report (evidence-based)
- `as_of`: 2026-03-04
- `total_features`: 3
- `completed_features`: 2
- `evidence_confirmed_features`: 2
- verification link:
  - [Verification matrix](../../verification-matrix.md) — execution evidence по EP-007. Читать, чтобы отслеживать подтверждённый прогресс по одному SSoT-источнику.

## Memory bank updates (after EP completion)
- Подтвердить webhook security (HMAC, timestamp, idempotency receipts): [AI webhooks](../../../spec/security/webhooks-ai.md) — формат подписи и обработка повторов. Читать, чтобы интеграция была защищённой.
- Синхронизировать оркестрацию AI job и статусы кампании: [AI processing](../../../spec/ai/ai-processing.md) — status machine и retry. Читать, чтобы HR мог безопасно перезапускать обработку.
- Зафиксировать правила видимости processed текста: [Results visibility](../../../spec/domain/results-visibility.md) — raw vs processed. Читать, чтобы employee видел только “безопасную” версию.
