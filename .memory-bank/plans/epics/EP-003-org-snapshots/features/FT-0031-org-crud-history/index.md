# FT-0031 — Org structure CRUD + history (+ soft delete)
Status: Completed (2026-03-04)

## User value
HR может вручную вести оргструктуру, не теряя историю перемещений и удалений.

## Deliverables
- Departments tree (parent/child).
- История: department membership, manager relations, positions.
- Soft delete: `is_active/deleted_at` исключает из актуальных списков.

## Context (SSoT links)
- [Org structure](../../../../../spec/domain/org-structure.md): доменная модель оргструктуры и временные интервалы. Читать, чтобы таблицы истории соответствовали “как бизнес думает”.
- [Soft delete & history](../../../../../spec/domain/soft-delete-and-history.md): правила soft delete и сохранения истории. Читать, чтобы удаление не ломало кампании/отчёты.
- [ERD / tables](../../../../../spec/data/erd.md): целевой список таблиц. Читать, чтобы миграции совпали с agreed схемой.
- [CLI command catalog](../../../../../spec/cli/command-catalog.md): команды `org *` и 1:1 к ops. Читать, чтобы не допустить “скрытых” команд.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист реализации. Читать, чтобы оргструктура была покрыта seeds/tests.

## Acceptance (auto)
### Setup
- Seed: `S2_org_basic --json` (handles include employees + departments).

### Action (integration test)
1) `org.department.move`:
  - employee: `handles.employee.staff_a1`
  - from: `handles.department.a`
  - to: `handles.department.b`
2) `org.manager.set`:
  - employee: `handles.employee.staff_a1`
  - manager: `handles.employee.head_b`
3) `employee.upsert`:
  - employee: `handles.employee.staff_a2`
  - `is_active=false`

### Assert
- История закрывает прошлую связь `end_at` и открывает новую `start_at`.
- Soft-deleted сущности не возвращаются в “активных” списках выбора.

### Client API ops (v1)
- `org.department.move`
- `org.manager.set`
- `employee.upsert`
- `employee.listActive`

## Implementation plan (target repo)
- DB:
  - `departments(company_id, parent_id, name, ...)` (дерево).
  - История:
    - `employee_department_history(employee_id, department_id, start_at, end_at?)`
    - `employee_manager_history(employee_id, manager_employee_id, start_at, end_at?)`
    - `employee_positions(employee_id, title, start_at, end_at?)`
  - Soft delete:
    - для `employees` и `departments` (как минимум) добавить `is_active` и/или `deleted_at` по spec.
- Core:
  - `org.department.move`: закрывает предыдущую запись истории (`end_at`), создаёт новую (`start_at=now`).
  - `org.manager.set`: аналогично, только для manager relations.
  - `employee.upsert`: поддерживает деактивацию (`is_active=false`) и не теряет историю.
- CLI:
  - Команды `org department move`, `org set-manager`, `employee upsert` должны быть 1:1 к ops и работать с `--json`.
- Тонкие моменты:
  - Временные интервалы должны быть непротиворечивыми (нет двух “активных” записей истории для одного employee одновременно).
  - Soft-deleted не исчезает из истории кампаний; просто не попадает в актуальные справочники выбора.

## Tests
- Integration: move/set-manager создают новую запись и закрывают старую (start/end корректны).
- Integration: soft delete исключает из “active list” (но не удаляет записи).

## Memory bank updates
- При изменении таблиц/полей обновить: [ERD / tables](../../../../../spec/data/erd.md) — SSoT схемы. Читать, чтобы доменные документы не отставали.
- При уточнении правил истории обновить: [Org structure](../../../../../spec/domain/org-structure.md) — SSoT правил. Читать, чтобы автогенерация матрицы и snapshot были согласованы.

## Verification (must)
- Automated tests:
  - `packages/core/src/ft/ft-0031-org-history-no-db.test.ts`
  - `packages/core/src/ft/ft-0031-org-history.test.ts`
  - `packages/cli/src/ft-0031-org-cli.test.ts`
- Must run: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, и targeted acceptance tests для FT-0031.

## Quality checks evidence (2026-03-04)
- `pnpm -r lint` → passed.
- `pnpm -r typecheck` → passed.
- `pnpm -r test` → passed.
- Build: N/A (изменения только в `packages/*`, отдельного build-gate для FT-0031 нет).

## Acceptance evidence (2026-03-04)
- `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0031-org-history-no-db.test.ts src/ft/ft-0031-org-history.test.ts` → passed (`ft-0031-org-history.test.ts`: integration subtest skipped без `SUPABASE_DB_POOLER_URL`/`DATABASE_URL`).
- `pnpm --filter @feedback-360/cli exec vitest run src/ft-0031-org-cli.test.ts` → passed.
- Проверено по acceptance intent: move department + set manager закрывают старые интервалы и открывают новые; деактивированный сотрудник исключается из `employee.listActive`.
