---
description: Company switcher screen contract for selecting the active company after login.
purpose: Read before changing multi-company selection UX or related auth/company flows.
status: Active
date: 2026-03-09
screen_id: SCR-COMPANY-SWITCHER
route: /select-company
actors:
  - authenticated_user
test_id_scope: scr-company-switcher
implementation_files:
  - apps/web/src/app/select-company/page.tsx
test_files:
  - apps/web/playwright/tests/ft-0081-auth-company-switcher.spec.ts
  - apps/web/playwright/tests/smoke/select-company-beta.spec.ts
---

# Screen spec — Company switcher
Status: Active (2026-03-09)

## Purpose
Дать аутентифицированному пользователю выбрать активную компанию, если memberships больше одной.

## Information blocks
- current user identity summary;
- list of available company memberships with roles;
- error/empty states if memberships cannot be resolved.

## Primary actions
- choose active company;
- continue into the workspace.

## Secondary actions
- sign out;
- return to login on fatal load error.

## States
- loading memberships;
- one company auto-continue or simplified choice;
- multi-company list;
- empty/no memberships;
- backend load error.

## Domain-specific behavior
- available companies come from `company_memberships`;
- selected company becomes the active context for all subsequent screens;
- no cross-company mixed workspace is allowed.

## Implementation entrypoints
- `apps/web/src/app/select-company/page.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0081-auth-company-switcher.spec.ts`
- `apps/web/playwright/tests/smoke/select-company-beta.spec.ts`
