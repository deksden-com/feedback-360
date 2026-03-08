---
description: FT-0013-questionnaire-ops-cli feature plan and evidence entry for EP-001-core-contract-client-cli.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-001-core-contract-client-cli/index.md
epic: EP-001
feature: FT-0013
---


# FT-0013 — Questionnaire ops + CLI
Status: Completed (2026-03-04)

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
5) `questionnaire list --campaign <handles.campaign.main> --status submitted --json` (проверить, что анкета появилась в submitted списке)
6) Повторный `questionnaire submit <questionnaire_id> --json`
7) Попытка `questionnaire save-draft <questionnaire_id> ... --json` после submit
8) `questionnaire list --campaign <handles.campaign.main>` (human output, без `--json`)

### Assert
- После (3): анкета `status=in_progress`, а у кампании выставлен `locked_at`.
- После (4): анкета `status=submitted`, `submitted_at` заполнен.
- После (5): `questionnaire_id` присутствует в submitted списке.
- Повторный `submit` (шаг 6):
  - либо идемпотентный no-op (предпочтительно),
  - либо доменная ошибка с typed `code` (должно быть зафиксировано в реализации и тестах).
- Шаг (7): submit-анкета immutable — `save-draft` не меняет ответы и возвращает typed error (`invalid_transition` или согласованный эквивалент).
- Шаг (8): human-формат команды доступен и возвращает `exitCode=0`.

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
- CLI/Integration: после `submitted` попытка `save-draft` должна быть запрещена и проверяться typed code.

## Memory bank updates
- При уточнении поведения повторного `submit` обновить: [Questionnaires](../../../../../spec/domain/questionnaires.md) — SSoT доменных инвариантов. Читать, чтобы UI/CLI и тесты были согласованы.

## Verification (must)
- Automated test: `packages/core/src/ft/ft-0013-questionnaires-no-db.test.ts` (acceptance no-db) повторяет list/saveDraft/submit + idempotent re-submit + immutable after submit.
- Automated test: `packages/core/src/ft/ft-0013-questionnaires.test.ts` (integration) повторяет те же шаги на реальной БД при наличии DB URL.
- Automated test: `packages/cli/src/ft-0013-questionnaire-cli.test.ts` проверяет CLI flow (`company use`, `questionnaire list/save-draft/submit`) включая human output и typed error после submit.
- Must run:
  - `FT-0013` acceptance тест,
  - GS1 (happy path) и GS5 (lock semantics) должны оставаться зелёными, т.к. опираются на list/saveDraft/submit.

## Visual evidence guidance
- Для этой фичи скриншоты **рекомендуются** (CLI-сценарий многошаговый, есть важные переходы состояния).
- Минимальный набор:
  1) `step-01` — `questionnaire list` до сохранения (status `not_started`),
  2) `step-02` — `save-draft` и подтверждение `locked_at`,
  3) `step-03` — `submit` + `submitted_at`,
  4) `step-04` — попытка `save-draft` после submit (typed error).
- Дополнительно можно приложить human-output `questionnaire list` (без `--json`) как UX-подтверждение.

## Implementation result (2026-03-04)
- Контракт расширен операциями анкеты:
  - `questionnaire.listAssigned`,
  - `questionnaire.saveDraft`,
  - `questionnaire.submit`,
  - runtime-парсеры input/output для всех DTO.
- DB слой расширен:
  - таблицы `campaigns`, `questionnaires` + миграция `0001_ft0013_campaigns_questionnaires.sql`,
  - seed `S5_campaign_started_no_answers` с handles `campaign.main`, `questionnaire.main`,
  - DB use-cases: list/saveDraft/submit с lock trigger и submitted immutability.
- Core dispatcher расширен обработчиками операций анкеты:
  - role checks,
  - проверка active company context,
  - typed errors (`forbidden`, `not_found`, `invalid_transition`, `campaign_ended_readonly`).
- CLI расширен командами:
  - `company use`,
  - `questionnaire list`,
  - `questionnaire save-draft`,
  - `questionnaire submit`,
  - сохранение active company в локальном CLI state.

## Quality checks evidence (2026-03-04)
- `pnpm -r lint` — passed.
- `pnpm -r typecheck` — passed.
- `pnpm -r test` — passed.
- `build` — N/A (в FT-0013 изменения покрыты unit/integration/CLI acceptance тестами; отдельный build-target не добавлялся).

## Acceptance evidence (2026-03-04)
- `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0013-questionnaires-no-db.test.ts` → passed.
- `pnpm --filter @feedback-360/cli exec vitest run src/ft-0013-questionnaire-cli.test.ts` → passed.
- `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0013-questionnaires.test.ts` → passed with integration test skipped when DB URL отсутствует (`hasDatabaseUrl=false`).
- В acceptance сценарии подтверждено:
  - list (`not_started` → `submitted`),
  - `saveDraft` выставляет `campaignLockedAt`,
  - `submit` переводит в `submitted`,
  - повторный `submit` — idempotent (`wasAlreadySubmitted=true`),
  - `saveDraft` после `submitted` возвращает `invalid_transition`,
  - human output `questionnaire list` содержит `status=submitted`.
