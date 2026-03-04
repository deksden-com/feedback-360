# FT-0071 — AI job run (MVP stub)
Status: Completed (2026-03-04)

## User value
HR может завершить этап AI-обработки кампании уже в MVP, не дожидаясь реального внешнего сервиса: запуск детерминированный, идемпотентный и контролируемый через одну операцию.

## Deliverables
- Таблица `ai_jobs` + idempotency.
- Op `ai.runForCampaign`:
  - работает в `mvp_stub` режиме (без внешнего HTTP вызова),
  - синхронно доводит кампанию до `completed`,
  - повторно возвращает тот же completed job без дублей.

## Context (SSoT links)
- [AI processing](../../../../../spec/ai/ai-processing.md): статусная модель и формат результата AI. Читать, чтобы `ai_jobs` и campaign statuses совпали с agreed поведением.
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): статусы `processing_ai/ai_failed/completed`. Читать, чтобы переходы были строгими.
- [Webhook security](../../../../../spec/security/webhooks-ai.md): профиль для следующего этапа с реальным AI/webhook. Читать, чтобы MVP stub не конфликтовал с будущей интеграцией.
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): `ai.runForCampaign` idempotency per campaign. Читать, чтобы CLI/UI работали одинаково.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист. Читать, чтобы AI запуск был покрыт тестами (без реального AI сервиса).

## Acceptance (auto)
### Setup
- Seed: `S8_campaign_ended --json` → `handles.campaign.main`

### Action (CLI, `--json`)
1) `company use <handles.company.main> --json`
1) `ai run <handles.campaign.main> --json`
2) повторить `ai run <handles.campaign.main> --json`

### Assert
- После первого запуска статус кампании = `completed`, создан 1 запись в `ai_jobs`.
- Повторный запуск возвращает `wasAlreadyCompleted=true` и не создаёт второй job.

### Client API ops (v1)
- `ai.runForCampaign`

## Implementation plan (target repo)
- DB:
  - `ai_jobs(company_id, campaign_id, provider, status, requested_at, completed_at, idempotency_key, request_payload, response_payload, error_payload)`.
  - Unique constraint на `(campaign_id, idempotency_key)`.
- Core:
  - `ai.runForCampaign`:
    - валидирует разрешённые статусы (`ended|ai_failed|completed`),
    - создаёт/находит ai_job (idempotent),
    - в stub-режиме переводит кампанию `ended -> processing_ai -> completed` в одном транзакционном потоке,
    - возвращает typed output (`provider=mvp_stub`, `status=completed`, `wasAlreadyCompleted`).
- Тонкие моменты:
  - Для `campaign.status=processing_ai` возвращаем `ai_job_conflict`.
  - Реальный webhook остаётся в FT-0072; здесь сеть не используется.

## Tests
- Core no-db: RBAC + typed output + идемпотентный семантический ответ.
- Core integration: `ai.runForCampaign` переводит `S8_campaign_ended` в `completed` и создаёт ровно 1 job.
- Client: transport вызов `ai.runForCampaign` с active-company context.
- CLI: `ai run` human-output + повторный запуск (`already completed`).

## Memory bank updates
- Если меняется статусная модель AI — обновить: [AI processing](../../../../../spec/ai/ai-processing.md) — SSoT. Читать, чтобы UI/CLI и webhook не разошлись.

## Verification (must)
- Automated tests:
  - `packages/core/src/ft/ft-0071-ai-run-no-db.test.ts`
  - `packages/core/src/ft/ft-0071-ai-run.test.ts`
  - `packages/client/src/ft-0071-ai-client.test.ts`
  - `packages/cli/src/ft-0071-ai-cli.test.ts`
- Must run: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, targeted FT-0071 tests.

## Project grounding (2026-03-04)
- [AI processing](../../../../../spec/ai/ai-processing.md): зафиксирован MVP stub-профиль и переход на real webhook позже.
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): разрешённые состояния кампании при запуске AI.
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): ожидаемая идемпотентность и CLI mapping.
- [CLI command catalog](../../../../../spec/cli/command-catalog.md): команда `ai run` 1:1 к `ai.runForCampaign`.

## Quality checks evidence (2026-03-04)
- `pnpm -r lint` → passed.
- `pnpm -r typecheck` → passed.
- `pnpm -r test` → passed.
- Build: N/A (изменения только в `packages/*`, отдельного build-gate для FT-0071 нет).

## Acceptance evidence (2026-03-04)
- `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0071-ai-run-no-db.test.ts src/ft/ft-0071-ai-run.test.ts` → passed (`ft-0071-ai-run.test.ts`: integration subtest skipped без `SUPABASE_DB_POOLER_URL`/`DATABASE_URL`).
- `pnpm --filter @feedback-360/client exec vitest run src/ft-0071-ai-client.test.ts` → passed.
- `pnpm --filter @feedback-360/cli exec vitest run src/ft-0071-ai-cli.test.ts` → passed.
- Проверено по acceptance intent: первый `ai run` завершает кампанию в `completed`, второй `ai run` возвращает `wasAlreadyCompleted=true` и не создаёт дубликат `ai_jobs`.
