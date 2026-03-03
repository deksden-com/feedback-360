# FT-0013 — Questionnaire ops + CLI
Status: Draft (2026-03-03)

## User value
Сотрудник может: увидеть список анкет, сохранять черновики и отправлять анкеты; система корректно триггерит lock на первом draft save.

## Deliverables
- Ops: `questionnaire.listAssigned`, `questionnaire.saveDraft`, `questionnaire.submit`.
- CLI: `questionnaire list|save-draft|submit` (human + `--json`).
- Domain rules: submit immutable; draft triggers campaign lock.

## Context (SSoT links)
- [Questionnaires](../../../../../spec/domain/questionnaires.md): модель анкеты, draft/save/submit и инварианты. Читать, чтобы операции не расходились с доменным описанием.
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): `locked_at` и запреты после lock/end. Читать, чтобы “первый ответ = draft save” был реализован кампанией-wide.
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): SSoT списка ops и ролей доступа. Читать, чтобы не добавлять “скрытые” методы и не ломать CLI 1:1.
- [CLI spec](../../../../../spec/cli/cli.md): форматы human/`--json`. Читать, чтобы CLI команды были предсказуемыми.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): чеклист “FT → код”. Читать, чтобы добавить contract/core/db/cli/tests в одном слайсе.

## Acceptance (auto)
### Setup
- Seed: `S5_campaign_started_no_answers --json`
  - handles: `company.main`, `campaign.main`.
- Actor: rater (employee).

### Action (CLI, `--json`)
1) `company use <handles.company.main>`
2) `questionnaire list --campaign <handles.campaign.main> --status not_started --json` → взять `questionnaire_id`
3) `questionnaire save-draft <questionnaire_id> ... --json`
4) `questionnaire submit <questionnaire_id> --json`

### Assert
- После (3): анкета `status=in_progress`, а у кампании выставлен `locked_at`.
- После (4): анкета `status=submitted`, `submitted_at` заполнен.
- Повторный `submit`:
  - либо идемпотентный no-op (предпочтительно),
  - либо доменная ошибка с typed `code` (должно быть зафиксировано в реализации и тестах).

### Client API ops (v1)
- `client.setActiveCompany` (client-local)
- `questionnaire.listAssigned`
- `questionnaire.saveDraft`
- `questionnaire.submit`

## Implementation plan (target repo)
- Contract:
  - Описать DTO для list/saveDraft/submit (включая typed errors: `campaign_ended_readonly`, `not_found`, `forbidden`).
  - Зафиксировать поведение повторного `submit`: предпочитаем идемпотентный no-op (same output), иначе — отдельный error code (должен быть SSoT).
- DB:
  - Таблицы: `questionnaires`, `questionnaire_items` (и минимально нужные FK к campaign/employee/model).
  - Индексы/unique: 1 анкета на (campaign, subject, rater) (если так в домене).
- Core:
  - `questionnaire.listAssigned`: фильтры по кампании/статусу, учитывает membership и роли.
  - `questionnaire.saveDraft`: upsert ответов + выставление `campaign.locked_at`, если ещё не было.
  - `questionnaire.submit`: перевод в `submitted`, проставление `submitted_at`, запрет повторного изменения (кроме no-op).
  - Lock должен ставиться транзакционно вместе с первым сохранением (чтобы не было гонок).
- CLI:
  - `questionnaire list|save-draft|submit` 1:1 маппятся на ops, поддерживают `--json`.

## Tests
- Unit: state machine анкеты (draft→submitted) + поведение повторного submit.
- Integration: `saveDraft` выставляет `campaign.locked_at` и это влияет на запрещённые ops (через GS5/FT-0044).
- CLI: `questionnaire list --json` детерминированно возвращает список, пригодный для сценариев.

## Memory bank updates
- При уточнении поведения повторного `submit` обновить: [Questionnaires](../../../../../spec/domain/questionnaires.md) — SSoT доменных инвариантов. Читать, чтобы UI/CLI и тесты были согласованы.

## Verification (must)
- Automated test: `packages/core/test/ft/ft-0013-questionnaires.test.ts` (integration) повторяет Acceptance list/saveDraft/submit + idempotency повторного submit.
- Must run:
  - `FT-0013` acceptance тест,
  - GS1 (happy path) и GS5 (lock semantics) должны оставаться зелёными, т.к. опираются на list/saveDraft/submit.
