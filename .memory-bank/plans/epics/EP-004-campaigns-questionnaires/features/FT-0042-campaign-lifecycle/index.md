---
description: FT-0042-campaign-lifecycle feature plan and evidence entry for EP-004-campaigns-questionnaires.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-004-campaigns-questionnaires/index.md
epic: EP-004
feature: FT-0042
---


# FT-0042 — Campaign lifecycle (create/start/stop/end)
Status: Completed (2026-03-04)

## User value
HR управляет жизненным циклом кампании; статусы отражают реальный процесс и служат основанием для запретов.

## Deliverables
- Ops: `campaign.create`, `campaign.start`, `campaign.stop`, `campaign.end`.
- State machine: draft→started→ended→processing_ai→(ai_failed|completed).

## Context (SSoT links)
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): SSoT state machine и правила переходов. Читать, чтобы операции start/stop/end не расходились с доменом.
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): перечень ops и их идемпотентность. Читать, чтобы ретраи и повторные вызовы были предсказуемы.
- [Error model](../../../../../spec/client-api/errors.md): как выражаем “нельзя перейти” (error code). Читать, чтобы сценарии проверяли фиксированные коды.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист. Читать, чтобы lifecycle был реализован в core и проверен тестами.

## Acceptance (auto)
### Setup
- Seed: `S4_campaign_draft --json` → `handles.campaign.main`

### Action (CLI, `--json`)
1) `campaign start <handles.campaign.main> --json`
2) `campaign stop <handles.campaign.main> --json` (или `campaign end ... --json`)

### Assert
- Статусы меняются только по допустимым переходам.
- Повторы переходов:
  - либо идемпотентны (предпочтительно),
  - либо возвращают доменную typed ошибку (с фиксированным `code`).

### Client API ops (v1)
- `campaign.start`
- `campaign.stop`
- `campaign.end`

## Implementation plan (target repo)
- Core state machine:
  - Реализовать переходы:
    - `draft -> started` (HR)
    - `started -> ended` (HR stop или cron end_at)
    - `ended -> processing_ai` (HR запускает AI, EP-007)
    - `processing_ai -> completed|ai_failed` (webhook, EP-007)
  - Повторные вызовы переходов сделать идемпотентными там, где это безопасно (предпочтительно), иначе — явный error code.
- DB:
  - `campaigns.status`, `start_at`, `end_at`, `timezone`, `locked_at` (для следующих фич).
  - Audit поля (кто/когда), если решим в MVP (иначе оставляем на hardening).
- API/CLI:
  - Команды `campaign start/stop/end` 1:1 к ops, `--json` возвращает новый статус.
- Тонкие моменты:
  - `campaign.end` может вызываться cron/service role (RBAC + RLS должны это позволять).
  - Операции не должны “тихо” менять другие поля (например participants/model).

## Tests
- Unit: таблица допустимых переходов (state machine) и idempotency повторов.
- Integration: start/stop/end реально меняют status в БД и не допускают недопустимых переходов.

## Memory bank updates
- Если уточняем idempotency/коды ошибок переходов — обновить: [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md) — SSoT переходов. Читать, чтобы сценарии GS6/GS5 ссылались на единые правила.

## Verification (must)
- Automated tests:
  - `packages/core/src/ft/ft-0042-campaign-lifecycle-no-db.test.ts`
  - `packages/core/src/ft/ft-0042-campaign-lifecycle.test.ts`
  - `packages/client/src/ft-0042-campaign-lifecycle-client.test.ts`
  - `packages/cli/src/ft-0042-campaign-lifecycle-cli.test.ts`
- Must run: `pnpm -r test` и smoke сценарий start/stop/end на seed `S4_campaign_draft`.

## Project grounding (2026-03-04)
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): статусы, допустимые переходы и idempotency правила для start/stop/end.
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): операции `campaign.start`, `campaign.stop`, `campaign.end` и роль HR Admin.
- [CLI command catalog](../../../../../spec/cli/command-catalog.md): 1:1 маппинг lifecycle команд на typed client API.
- [GS6 Started immutability](../../../../../spec/testing/scenarios/gs6-started-immutability.md): зависимый сценарий, который опирается на корректный переход в `started`.

## Quality checks evidence (2026-03-04)
- `pnpm -r lint` → passed.
- `pnpm -r typecheck` → passed.
- `pnpm -r test` → passed.
- Build: N/A (изменения в packages/core/client/cli/db без нового build-gate).

## Acceptance evidence (2026-03-04)
- `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0042-campaign-lifecycle-no-db.test.ts src/ft/ft-0042-campaign-lifecycle.test.ts` → passed (`integration subtest skipped` без `SUPABASE_DB_POOLER_URL`/`DATABASE_URL`).
- `pnpm --filter @feedback-360/client exec vitest run src/ft-0042-campaign-lifecycle-client.test.ts` → passed.
- `pnpm --filter @feedback-360/cli exec vitest run src/ft-0042-campaign-lifecycle-cli.test.ts` → passed.
- Проверено по intent: `campaign.start` и `campaign.stop/end` поддерживают идемпотентные повторы в целевом статусе; недопустимые переходы дают `invalid_transition`; не-HR роли получают `forbidden`.
