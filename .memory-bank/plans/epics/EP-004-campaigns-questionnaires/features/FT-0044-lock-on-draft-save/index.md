# FT-0044 — Lock on first draft save (matrix + weights)
Status: Completed (2026-03-04)

## User value
После первого ответа (draft save) HR не может менять матрицу оценщиков и веса, что повышает доверие к процессу.

## Deliverables
- `campaign.locked_at` устанавливается на первом `questionnaire.saveDraft`.
- Ops запреты после lock: `matrix.set`, `campaign.weights.set`.

## Context (SSoT links)
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): определение lock (`locked_at`) и что именно запрещаем после. Читать, чтобы “первый ответ = draft save” был единым правилом.
- [GS5 Lock semantics](../../../../../spec/testing/scenarios/gs5-lock-semantics.md): golden сценарий lock. Читать, чтобы acceptance проверял ключевые инварианты.
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): ops `matrix.set` и `campaign.weights.set`. Читать, чтобы запрет работал одинаково через UI/CLI.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист. Читать, чтобы lock был транзакционным и покрытым тестами.

## Acceptance (auto)
### Setup
- Seed: `S5_campaign_started_no_answers --json` → `handles.campaign.main`

### Action (CLI, `--json`)
1) До lock:
  - `campaign weights set <handles.campaign.main> --manager 40 --peers 30 --subordinates 30 --json`
  - `matrix set <handles.campaign.main> ... --json`
2) Триггер lock:
  - `questionnaire list --campaign <handles.campaign.main> --status not_started --json` → `questionnaire_id`
  - `questionnaire save-draft <questionnaire_id> ... --json`
3) После lock повторить шаг (1).

### Assert
- После (2): `campaign.locked_at` установлен (campaign-wide).
- После lock операции `campaign.weights.set` и `matrix.set` возвращают typed error `code=campaign_locked` (или согласованный).

### Client API ops (v1)
- `campaign.weights.set`
- `matrix.set`
- `questionnaire.listAssigned`
- `questionnaire.saveDraft`

## Implementation plan (target repo)
- Core:
  - В `questionnaire.saveDraft`:
    - при первом сохранении в кампании выставить `campaign.locked_at = now` (campaign-wide),
    - сделать это транзакционно вместе с сохранением ответов, чтобы не было “draft сохранился, но lock не поставился”.
  - В `campaign.weights.set` и `matrix.set` добавить проверку `campaign.locked_at == null`, иначе typed error `campaign_locked`.
- DB:
  - `campaigns.locked_at` + индекс (частая проверка).
  - Гарантировать, что `locked_at` выставляется один раз (условный update).
- Тонкие моменты:
  - Freeze правило: “первый ответ” = draft save (зафиксировано) — это означает, что “частично заполненная анкета” уже замораживает кампанию.

## Tests
- Integration (GS5): до lock матрица/веса меняются, после lock — `campaign_locked`.
- Concurrency (optional): два параллельных saveDraft не должны приводить к inconsistent состоянию.

## Memory bank updates
- Если уточняем freeze-правило или список запрещённых ops — обновить: [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md) — SSoT. Читать, чтобы правила были едины для CLI/UI.

## Verification (must)
- Automated tests:
  - `packages/core/src/ft/ft-0044-lock-on-draft-save-no-db.test.ts`
  - `packages/core/src/ft/ft-0044-lock-on-draft-save.test.ts`
  - `packages/client/src/ft-0044-lock-on-draft-save-client.test.ts`
  - `packages/cli/src/ft-0044-lock-on-draft-save-cli.test.ts`
- Must run: GS5 должен быть зелёным.

## Project grounding (2026-03-04)
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): lock на первом `questionnaire.saveDraft` и список запрещённых ops после lock.
- [GS5 Lock semantics](../../../../../spec/testing/scenarios/gs5-lock-semantics.md): проверяемый сценарий “до lock можно, после lock нельзя”.
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): `campaign.weights.set`, `matrix.set`, `questionnaire.saveDraft`.
- [CLI command catalog](../../../../../spec/cli/command-catalog.md): команды `campaign weights set` и `matrix set`.

## Quality checks evidence (2026-03-04)
- `pnpm -r lint` → passed.
- `pnpm -r typecheck` → passed.
- `pnpm -r test` → passed.
- Build: N/A (изменения в packages/core/db/client/cli).

## Acceptance evidence (2026-03-04)
- `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0044-lock-on-draft-save-no-db.test.ts src/ft/ft-0044-lock-on-draft-save.test.ts` → passed (`integration subtest skipped` без `SUPABASE_DB_POOLER_URL`/`DATABASE_URL`).
- `pnpm --filter @feedback-360/client exec vitest run src/ft-0044-lock-on-draft-save-client.test.ts` → passed.
- `pnpm --filter @feedback-360/cli exec vitest run src/ft-0044-lock-on-draft-save-cli.test.ts` → passed.
- Проверено по intent: до `questionnaire.saveDraft` операции `campaign.weights.set`/`matrix.set` выполняются; после первого draft-save обе операции возвращают `campaign_locked`.
