---
description: HR employee detail screen contract for profile, history, and provisioning context.
purpose: Read before changing employee profile UX, history presentation, or provisioning visibility.
status: Active
date: 2026-03-09
screen_id: SCR-HR-EMPLOYEE-DETAIL
route: /hr/employees/[employeeId]
actors:
  - hr_admin
  - hr_reader
test_id_scope: scr-hr-employee-detail
implementation_files:
  - apps/web/src/app/hr/employees/[employeeId]/page.tsx
test_files:
  - apps/web/playwright/tests/ft-0162-employee-profile-provisioning.spec.ts
---

# Screen spec — HR employee detail
Status: Active (2026-03-09)

## Purpose
Профиль сотрудника в HR-справочнике.

## Information blocks
- summary hero с identity, ролью, подразделением и manager context;
- provisioning and membership summary;
- history/changes sections;
- переходы назад в directory и к связанным HR flows.

## Primary actions
- inspect employee identity, org placement, and provisioning state;
- edit/provision where current role and current implementation allow.

## Secondary actions
- navigate back to directory;
- move into related org/campaign/admin flows.

## States
- active employee;
- inactive/soft-deleted marker;
- missing manager/department history;
- read-only role (`hr_reader`) without edit actions.

## Domain-specific behavior
- employee history remains important even if current visible placement changed;
- user/email linkage and membership provisioning belong here conceptually, but employee remains distinct from auth identity.

## Implementation entrypoints
- `apps/web/src/app/hr/employees/[employeeId]/page.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0162-employee-profile-provisioning.spec.ts`
