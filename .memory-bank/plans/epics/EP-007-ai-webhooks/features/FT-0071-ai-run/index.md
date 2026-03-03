# FT-0071 — AI job run (ai_jobs + ai.runForCampaign)
Status: Draft (2026-03-03)

## User value
HR может запустить AI обработку результатов кампании; система отражает процесс в статусах и не запускает “дубликаты”.

## Deliverables
- Таблица `ai_jobs` + idempotency.
- Op `ai.runForCampaign`:
  - переводит кампанию в `processing_ai`,
  - инициирует внешний запрос.

## Context (SSoT links)
- [AI processing](../../../../../spec/ai/ai-processing.md): статусная модель и формат результата AI. Читать, чтобы `ai_jobs` и campaign statuses совпали с agreed поведением.
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): статусы `processing_ai/ai_failed/completed`. Читать, чтобы переходы были строгими.
- [Webhook security](../../../../../spec/security/webhooks-ai.md): обратный webhook и идемпотентность. Читать, чтобы запуск job был совместим с webhook обработчиком.
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): `ai.runForCampaign` idempotency per campaign. Читать, чтобы CLI/UI работали одинаково.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист. Читать, чтобы AI запуск был покрыт тестами (без реального AI сервиса).

## Acceptance (auto)
### Setup
- Seed: `S8_campaign_ended --json` → `handles.campaign.main`

### Action (CLI, `--json`)
1) `ai run <handles.campaign.main> --json`
2) повторить `ai run <handles.campaign.main> --json`

### Assert
- Кампания переходит в `processing_ai`.
- Повтор не создаёт второй активный job без явного retry (идемпотентность per campaign).

### Client API ops (v1)
- `ai.runForCampaign`

## Implementation plan (target repo)
- DB:
  - `ai_jobs(campaign_id, status, requested_at, completed_at, idempotency_key, error_json, ...)`.
  - Unique constraint: один “active” job на campaign (или enforce idempotency key).
- Core:
  - `ai.runForCampaign`:
    - валидирует `campaign.status=ended` (или разрешённый),
    - создаёт/находит ai_job (idempotent),
    - переводит кампанию в `processing_ai`,
    - инициирует HTTP POST в внешний сервис (через port `AiClient`).
  - Retry:
    - либо отдельная операция `ai.retryForCampaign` (позже),
    - либо `ai.runForCampaign` принимает флаг `force=true` (но на MVP лучше отдельная кнопка/оп).
- Тонкие моменты:
  - Запуск и перевод статуса должны быть согласованы с webhook: webhook должен ссылаться на `ai_job_id`.
  - В тестах AI сервис должен быть мокнут (не сеть).

## Tests
- Unit: idempotency per campaign (повторный вызов не создаёт второй job).
- Integration: `ai.runForCampaign` переводит campaign в `processing_ai` и пишет ai_job.

## Memory bank updates
- Если меняется статусная модель AI — обновить: [AI processing](../../../../../spec/ai/ai-processing.md) — SSoT. Читать, чтобы UI/CLI и webhook не разошлись.

## Verification (must)
- Automated test: `packages/core/test/ft/ft-0071-ai-run.test.ts` (integration) проверяет idempotent `ai.runForCampaign` и переход в `processing_ai` без дублей.
- Must run: `pnpm -r test` + проверка, что повтор `ai run` не создаёт второй активный job.
