# FT-0073 — Processed text aggregates + visibility
Status: Completed (2026-03-05)

## User value
Employee/Manager видят только AI-обработанные тексты (processed/summary), `hr_reader` тоже не получает raw, а raw сохраняется только для `hr_admin`. Это снижает риск deanonymization и удерживает прозрачность для HR.

## Deliverables
- Ingestion AI результата в `questionnaires.draft_payload.competencyComments`:
  - `processedText`,
  - `summaryText`,
  - без перезаписи `rawText`.
- Идемпотентное применение (через `ai_webhook_receipts` из FT-0072):
  - первый webhook применяет patch,
  - повтор с тем же `idempotencyKey` — no-op.
- Ролевые витрины результатов:
  - `results.getMyDashboard` / `results.getTeamDashboard`: без `rawText`,
  - `results.getHrView`: для `hr_admin` — `rawText` + `processedText` + `summaryText`, для `hr_reader` — только `processedText` + `summaryText`.

## Context (SSoT links)
- [AI processing](../../../../../spec/ai/ai-processing.md): где и как храним processed/summary. Читать, чтобы webhook и results использовали единый формат.
- [Results visibility](../../../../../spec/domain/results-visibility.md): правила raw vs processed по ролям. Читать, чтобы employee/manager не получали raw.
- [Webhook security](../../../../../spec/security/webhooks-ai.md): HMAC + idempotency + retry. Читать, чтобы ingestion оставался безопасным.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): вертикальный чеклист. Читать, чтобы FT закрывался тестами и evidence.

## Acceptance (auto)
### Setup
- Seed: `S9_campaign_completed_with_ai --json`.
- Создать/использовать `ai_job` для кампании, применить webhook payload с `questionnaire_comments`.

### Action
1) Применить webhook payload с новым `processed_text`/`summary_text` для `questionnaire_id + competency_id`.
2) Повторить тот же webhook (тот же `idempotencyKey`).
3) Запросить результаты тремя операциями:
   - `results.getMyDashboard`,
   - `results.getTeamDashboard`,
   - `results.getHrView`.

### Assert
- После первого apply:
  - `processedText/summaryText` обновлены в questionnaire payload,
  - `rawText` сохранён.
- Повтор apply:
  - no-op, значения не перезаписаны.
- Visibility:
  - employee/manager output не содержит `rawText`,
  - `hr_reader` output не содержит `rawText`,
  - `hr_admin` output содержит `rawText` и обработанные поля.

### Client API ops (v1)
- `ai.webhook.receive`
- `results.getMyDashboard`
- `results.getTeamDashboard`
- `results.getHrView`

## Implementation plan (target repo)
- `packages/db/src/ai.ts`:
  - добавить разбор `payload.questionnaire_comments[]` (snake_case вход),
  - мержить `processedText/summaryText` в `questionnaires.draft_payload.competencyComments`,
  - не трогать `rawText`,
  - не применять повторно при duplicate `idempotencyKey`.
- `packages/api-contract/src/index.ts`:
  - ужесточить dashboard parser: `rawText` запрещён для `results.getMyDashboard`/`results.getTeamDashboard`.
- Тесты:
  - DB integration на ingestion + retry no-op,
  - Core integration на visibility после webhook apply.

## Tests
- `packages/db/src/ft/ft-0073-processed-aggregates.test.ts`
- `packages/core/src/ft/ft-0073-processed-text-visibility.test.ts`

## Memory bank updates
- Обновить [AI processing](../../../../../spec/ai/ai-processing.md): формат `questionnaire_comments` и merge semantics.
- Обновить [Webhook security](../../../../../spec/security/webhooks-ai.md): структура payload для processed text.
- Синхронизировать [Verification matrix](../../../../verification-matrix.md): обязательные тесты и evidence по FT-0073.

## Project grounding (2026-03-05)
- [AI processing](../../../../../spec/ai/ai-processing.md): agreed storage granularity для processed/summary.
- [Results visibility](../../../../../spec/domain/results-visibility.md): role-based shaping инварианты.
- [GS1 happy path](../../../../../spec/testing/scenarios/gs1-happy-path.md): ожидание “employee без raw”.
- [FT-0072 webhook security](../FT-0072-webhook-security/index.md): existing idempotency/security baseline.

## Quality checks evidence (2026-03-05)
- `pnpm --filter @feedback-360/api-contract lint` → passed.
- `pnpm --filter @feedback-360/api-contract typecheck` → passed.
- `pnpm --filter @feedback-360/db lint` → passed.
- `pnpm --filter @feedback-360/db typecheck` → passed.
- `pnpm --filter @feedback-360/core lint` → passed.
- `pnpm --filter @feedback-360/core typecheck` → passed.
- Build: N/A (изменения в contracts/db/core, без новых build targets).

## Acceptance evidence (2026-03-05)
- `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/ft/ft-0073-processed-aggregates.test.ts` → passed.
- `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0073-processed-text-visibility.test.ts` → passed.
- Regression webhook idempotency:
  - `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/ft/ft-0072-ai-webhook.test.ts --testTimeout 30000` → passed.
- Проверено по intent:
  - webhook apply обновляет processed/summary,
  - duplicate key даёт no-op,
  - employee/manager/hr_reader не получают raw, `hr_admin` получает raw+processed+summary.
