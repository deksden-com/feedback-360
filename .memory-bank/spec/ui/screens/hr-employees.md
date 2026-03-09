---
description: HR employees screen contract for the employee directory list surface.
purpose: Read before changing employee CRUD list UX, guides, or automation for the directory.
status: Active
date: 2026-03-09
screen_id: SCR-HR-EMPLOYEES
route: /hr/employees
actors:
  - hr_admin
  - hr_reader
test_id_scope: scr-hr-employees
implementation_files:
  - apps/web/src/app/hr/employees/page.tsx
test_files:
  - apps/web/playwright/tests/ft-0161-employee-directory.spec.ts
  - apps/web/playwright/tests/ft-0214-hr-crud-hierarchy-polish.spec.ts
---

# Screen spec — HR employees
Status: Active (2026-03-09)

## Purpose
Каталог сотрудников компании для HR.

## Information blocks
- summary block с количеством активных сотрудников и состоянием справочника;
- CRUD toolbar с поиском, фильтрами и primary CTA создания;
- список сотрудников с identity-first строками/карточками;
- переход к профилю сотрудника.

## Primary actions
- search/filter employees;
- open employee detail;
- create employee (`hr_admin`).

## Secondary actions
- inspect status/role/department context from the list surface.

## States
- populated catalog;
- filtered/search state;
- empty results state;
- read-only role (`hr_reader`) without destructive actions.

## Domain-specific behavior
- employee rows represent HR entities, not auth users;
- soft-deleted/inactive markers must remain visible where relevant;
- directory is the entrypoint into org/history/provisioning flows, not the place for campaign-specific snapshots.

## Implementation entrypoints
- `apps/web/src/app/hr/employees/page.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0161-employee-directory.spec.ts`
- `apps/web/playwright/tests/ft-0214-hr-crud-hierarchy-polish.spec.ts`
