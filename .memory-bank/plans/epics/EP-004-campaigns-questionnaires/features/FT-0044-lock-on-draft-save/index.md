# FT-0044 — Lock on first draft save (matrix + weights)
Status: Draft (2026-03-03)

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
- Automated test: `packages/core/test/ft/ft-0044-lock-on-draft-save.test.ts` (integration) повторяет GS5: до lock разрешено, после lock → `campaign_locked`.
- Must run: GS5 должен быть зелёным.
