# FT-0045 — Ended read-only (questionnaires)
Status: Draft (2026-03-03)

## User value
После дедлайна анкеты становятся read-only; никто не может “доправить задним числом”.

## Deliverables
- При `campaign.status=ended` операции `questionnaire.saveDraft/submit` запрещены.
- Error code: `campaign_ended_readonly` (предложение) или согласованный.

## Context (SSoT links)
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): когда кампания считается `ended` (end_at или HR stop). Читать, чтобы read-only включался корректно.
- [Questionnaires](../../../../../spec/domain/questionnaires.md): что именно запрещаем после ended (draft/save/submit). Читать, чтобы запрет не обходился через другие ops.
- [Error model](../../../../../spec/client-api/errors.md): как называем доменные ошибки и как маппим в HTTP/CLI. Читать, чтобы код ошибки был стабильным.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист реализации. Читать, чтобы запрет был в core и покрыт тестом.

## Acceptance (auto)
### Setup
- Seed: `S8_campaign_ended --json` → `handles.campaign.main`

### Action (CLI, `--json`)
1) `questionnaire list --campaign <handles.campaign.main> --status in_progress --json` → `questionnaire_id` (или любая анкета)
2) `questionnaire save-draft <questionnaire_id> ... --json`
3) `questionnaire submit <questionnaire_id> --json`

### Assert
- Оба вызова возвращают доменную typed ошибку `code=campaign_ended_readonly` (или согласованный эквивалент).
- Данные анкеты не меняются.

### Client API ops (v1)
- `questionnaire.listAssigned`
- `questionnaire.saveDraft`
- `questionnaire.submit`

## Implementation plan (target repo)
- Core:
  - В `questionnaire.saveDraft` и `questionnaire.submit` проверить `campaign.status`:
    - если `ended` (или позже `processing_ai/completed`) → typed error `campaign_ended_readonly`.
  - Гарантировать отсутствие частичных изменений (ничего не пишем в БД при запрете).
- Contract/CLI:
  - Зафиксировать `campaign_ended_readonly` в SSoT списке кодов.
- Тонкие моменты:
  - Запрет должен срабатывать и для draft saves (чтобы нельзя было “сохранить черновик после дедлайна”).

## Tests
- Integration: попытки saveDraft/submit после ended → `campaign_ended_readonly`, данные не меняются.

## Memory bank updates
- Если расширяем список статусов “read-only” — обновить: [Questionnaires](../../../../../spec/domain/questionnaires.md) — SSoT. Читать, чтобы UI и тесты совпадали с core.

## Verification (must)
- Automated test: `packages/core/test/ft/ft-0045-ended-readonly.test.ts` (integration) проверяет saveDraft/submit после ended → `campaign_ended_readonly` и no writes.
- Must run: `pnpm -r test` + smoke на seed `S8_campaign_ended`.
