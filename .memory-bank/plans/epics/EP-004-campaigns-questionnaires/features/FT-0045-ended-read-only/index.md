# FT-0045 — Ended read-only (questionnaires)
Status: Completed (2026-03-04)

## User value
После дедлайна анкеты становятся read-only; никто не может “доправить задним числом”.

## Deliverables
- При `campaign.status=ended` операции `questionnaire.saveDraft/submit` запрещены.
- При downstream-статусах (`processing_ai`, `ai_failed`, `completed`) эти операции также запрещены.
- Error code: `campaign_ended_readonly`.

## Context (SSoT links)
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): когда кампания считается `ended` (end_at или HR stop). Читать, чтобы read-only включался корректно.
- [Questionnaires](../../../../../spec/domain/questionnaires.md): что именно запрещаем после ended (draft/save/submit). Читать, чтобы запрет не обходился через другие ops.
- [Error model](../../../../../spec/client-api/errors.md): как называем доменные ошибки и как маппим в HTTP/CLI. Читать, чтобы код ошибки был стабильным.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист реализации. Читать, чтобы запрет был в core и покрыт тестом.

## Acceptance (auto)
### Setup
- Seed: `S8_campaign_ended --json` → `handles.campaign.main`

### Action (CLI, `--json`)
1) `questionnaire list --campaign <handles.campaign.main> --status not_started --json` → `questionnaire_id` (или любая анкета)
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
- Automated test: `packages/core/src/ft/ft-0045-ended-readonly.test.ts` (integration) проверяет saveDraft/submit после ended → `campaign_ended_readonly` и no writes.
- Must run: `pnpm -r test` + smoke на seed `S8_campaign_ended`.

## Project grounding (2026-03-04)
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): статусы после `ended` и их смысл.
- [Questionnaires](../../../../../spec/domain/questionnaires.md): read-only поведение для анкеты после дедлайна.
- [GS12 Campaign progress](../../../../../spec/testing/scenarios/gs12-campaign-progress.md): why дедлайн/статусы должны быть строгими.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): порядок “код → тесты → evidence → docs update”.

## Quality checks evidence (2026-03-04)
- `pnpm --filter @feedback-360/db lint` → passed.
- `pnpm --filter @feedback-360/db typecheck` → passed.
- `pnpm --filter @feedback-360/core lint` → passed.
- `pnpm --filter @feedback-360/core typecheck` → passed.

## Acceptance evidence (2026-03-04)
- `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0045-ended-readonly.test.ts` → passed (integration, Supabase pooler).
- CLI scenario (real DB, seed `S8_campaign_ended`) via `pnpm exec tsx packages/cli/src/index.ts`:
  - `questionnaire list --status not_started` before mutations → `1` item.
  - `questionnaire save-draft` → `error.code=campaign_ended_readonly`.
  - `questionnaire submit` → `error.code=campaign_ended_readonly`.
  - `questionnaire list --status not_started` after попыток → `1` item.
  - `questionnaire list --status submitted` after попыток → `0` items.
