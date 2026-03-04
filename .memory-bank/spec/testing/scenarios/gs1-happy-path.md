# GS1 — Happy path (indicators)
Status: Draft (2026-03-03)

## Setup
- Seed: `S4_campaign_draft` (requires `S2_org_basic` + `S3_model_indicators`)
- Actors: HR Admin, Employee rater(s)

## Action (high level)
1) HR стартует кампанию.
2) Rater сохраняет draft (первый draft save) → кампания locked.
3) Rater submit анкеты.
4) Кампания ends (cron by `end_at` или HR stop).
5) HR запускает AI job → webhook success.
   - MVP profile: `mvp_stub` (без webhook), кампания завершается синхронно в `completed`.

## Assertions
- Status:
  - target (full): `started -> ended -> processing_ai -> completed`,
  - MVP stub: `started -> ended -> (sync stub) -> completed`.
- После lock запрещены изменения матрицы/весов.
- После ended анкеты read-only.
- Employee видит агрегаты и processed/summary open text, не видит raw.

## Client API ops (v1)
- `campaign.start`
- `questionnaire.saveDraft`
- `questionnaire.submit`
- `campaign.stop` (если manual stop вместо cron)
- `campaign.end` (если manual helper вместо cron)
- `ai.runForCampaign`
- `ai.webhook.receive` (full profile, не требуется для MVP stub)

## CLI example (human; use `--json` in tests)
1) `seed --scenario S4_campaign_draft --json` → взять `handles.company.main`, `handles.campaign.main`.
2) `company use <handles.company.main>`
3) `campaign start <handles.campaign.main>`
4) `questionnaire list --campaign <handles.campaign.main> --status not_started --json` → взять `questionnaire_id`
5) `questionnaire save-draft <questionnaire_id> ...`
6) `questionnaire submit <questionnaire_id>`
7) `campaign end <handles.campaign.main>` (или cron)
8) `ai run <handles.campaign.main>`
9) (full profile only) вызвать endpoint `ai.webhook.receive` с валидной подписью и `idempotency_key`.
