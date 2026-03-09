---
description: HR employee create screen contract for creating employees in the HR directory.
purpose: Read before changing employee creation UX or provisioning-related follow-up flows.
status: Active
date: 2026-03-09
screen_id: SCR-HR-EMPLOYEE-CREATE
route: /hr/employees/new
actors:
  - hr_admin
test_id_scope: scr-hr-employee-create
implementation_files:
  - apps/web/src/app/hr/employees/new/page.tsx
test_files:
  - apps/web/playwright/tests/ft-0161-employee-directory.spec.ts
  - apps/web/playwright/tests/ft-0162-employee-profile-provisioning.spec.ts
---

# Screen spec — HR employee create
Status: Active (2026-03-09)

## Purpose
Создание записи сотрудника в HR directory и подготовка основы для последующего provisioning/linking.

## Information blocks
- create form with employee identity and contact fields;
- role/position/department context inputs where supported;
- validation and post-create success feedback.

## Primary actions
- create employee;
- save and open employee detail/profile.

## Secondary actions
- cancel and return to employee directory.

## States
- blank form;
- validation errors;
- submit in progress;
- successful creation redirect;
- forbidden for non-admin roles.

## Domain-specific behavior
- `employee` is a HR entity, separate from auth `user`;
- public signup is not implied by employee creation;
- created employee later participates in org/campaign flows and can be linked to auth identity.

## Implementation entrypoints
- `apps/web/src/app/hr/employees/new/page.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0161-employee-directory.spec.ts`
- `apps/web/playwright/tests/ft-0162-employee-profile-provisioning.spec.ts`
