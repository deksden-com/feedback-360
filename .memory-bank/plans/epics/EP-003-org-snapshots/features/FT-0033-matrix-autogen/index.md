---
description: FT-0033-matrix-autogen feature plan and evidence entry for EP-003-org-snapshots.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-003-org-snapshots/index.md
epic: EP-003
feature: FT-0033
---


# FT-0033 — Matrix autogeneration (from selected departments)
Status: Completed (2026-03-04)

## User value
HR выбирает подразделения, а система предлагает матрицу оценщиков, корректно учитывая иерархию и peers между руководителями одного уровня.

## Deliverables
- Ops:
  - `campaign.participants.addFromDepartments` — включить сотрудников выбранных подразделений (с дочерними).
  - `matrix.generateSuggested --from-departments ...` — предложить назначения по direct-manager (из snapshot в started, из live org в draft).
- Suggested assignments (agreed rules):
  - `manager` = direct manager
  - `peers` = same manager (включая правило “руководители подразделений одного уровня — коллеги”)
  - `subordinates` = direct reports
  - `self` = optional (default on)

## Context (SSoT links)
- [Assignments & matrix](../../../../../spec/domain/assignments-and-matrix.md): agreed правила autogen и редактирования до lock. Читать, чтобы генератор соответствовал домену.
- [Org structure](../../../../../spec/domain/org-structure.md): direct-manager и дерево подразделений. Читать, чтобы “выбранное подразделение + дочерние” считалось одинаково везде.
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): draft/started и snapshot. Читать, чтобы понимать, когда читаем live org, а когда snapshot.
- [GS11 Matrix autogen](../../../../../spec/testing/scenarios/gs11-matrix-autogen.md): golden сценарий autogen. Читать, чтобы acceptance был сильным и проверял иерархию.
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): SSoT ops. Читать, чтобы новые ops были отражены и в CLI 1:1.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист реализации. Читать, чтобы фича прошла через contract/core/db/cli/tests.

## Acceptance (auto)
### Setup
Seed: `S4_campaign_draft --variant no_participants --json` → handles: `company.main`, `campaign.main`, `department.a`, `department.b`, `employee.head_a`, `employee.head_b`.

### Action (CLI, `--json`)
1) `company use <handles.company.main> --json`
2) `campaign participants add-departments <handles.campaign.main> --from-departments <handles.department.a> <handles.department.b> --json`
3) `matrix generate <handles.campaign.main> --from-departments <handles.department.a> <handles.department.b> --json`

### Assert
- `employee.head_a` и `employee.head_b` назначены peers друг другу (same upstream manager).
- Сотрудники department A получают manager=`employee.head_a`; department B → manager=`employee.head_b`.

### Client API ops (v1)
- `client.setActiveCompany` (client-local)
- `campaign.participants.addFromDepartments`
- `matrix.generateSuggested`

## Implementation plan (target repo)
- Contract:
  - Добавить op `campaign.participants.addFromDepartments` (input: `campaign_id`, `department_ids[]`, options) и описать deterministic output (например списки добавленных employees).
  - Уточнить input `matrix.generateSuggested` (берём `department_ids` как фильтр или читаем “выбранные” из campaign settings; на MVP проще принимать явно).
- Core:
  - `campaign.participants.addFromDepartments`: разворачивает дерево, находит employees, добавляет в participants (idempotent).
  - `matrix.generateSuggested`: строит suggestions по direct-manager отношениям:
    - в draft — по live org,
    - в started — по snapshot (если доступно и уместно).
  - Важно: один rater может быть peer для одного subject и manager для другого (разные строки назначения).
- DB:
  - Таблицы participants/assignments должны позволять:
    - избежать дублей (unique ключи),
    - хранить source (`auto`/`manual`) и роль оценщика.
- CLI:
  - Добавить команду `campaign participants add-departments` 1:1 к op.
  - `matrix generate` должен быть детерминированным по output при одинаковом input.

## Tests
- Integration (GS11): для выбранных подразделений autogen предлагает ожидаемые peers/manager связи.
- Integration: идемпотентность `addFromDepartments` (повторный вызов не создаёт дублей).

## Memory bank updates
- После добавления ops обновить:
  - [Operation catalog](../../../../../spec/client-api/operation-catalog.md): SSoT ops. Читать, чтобы CLI/UI не расходились.
  - [CLI command catalog](../../../../../spec/cli/command-catalog.md): 1:1 команды. Читать, чтобы acceptance сценарии были выполнимы через CLI.

## Verification (must)
- Automated tests:
  - `packages/core/src/ft/ft-0033-matrix-autogen-no-db.test.ts`
  - `packages/core/src/ft/ft-0033-matrix-autogen.test.ts`
  - `packages/cli/src/ft-0033-matrix-cli.test.ts`
- Must run: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, targeted FT-0033 acceptance tests.

## Project grounding (2026-03-04)
- [Assignments & matrix](../../../../../spec/domain/assignments-and-matrix.md): целевые правила manager/peer/subordinate/self и lock-ограничения.
- [Org structure](../../../../../spec/domain/org-structure.md): direct-manager и отделы как источник автогенерации.
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): ограничения для draft/started и freeze по `locked_at`.
- [GS11 Matrix autogen](../../../../../spec/testing/scenarios/gs11-matrix-autogen.md): acceptance intent и CLI поток.
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): согласование ops + RBAC.
- [CLI command catalog](../../../../../spec/cli/command-catalog.md): команды 1:1 к ops.

## Quality checks evidence (2026-03-04)
- `pnpm -r lint` → passed.
- `pnpm -r typecheck` → passed.
- `pnpm -r test` → passed.
- Build: N/A (изменения только в `packages/*`, отдельного build-gate для FT-0033 нет).

## Acceptance evidence (2026-03-04)
- `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0033-matrix-autogen-no-db.test.ts src/ft/ft-0033-matrix-autogen.test.ts` → passed (`ft-0033-matrix-autogen.test.ts`: integration subtest skipped без `SUPABASE_DB_POOLER_URL`/`DATABASE_URL`).
- `pnpm --filter @feedback-360/cli exec vitest run src/ft-0033-matrix-cli.test.ts` → passed.
- Проверено по acceptance intent: `head_a` и `head_b` получают `peer` друг на друга; `staff_a1 -> manager=head_a`, `staff_b1 -> manager=head_b`.
