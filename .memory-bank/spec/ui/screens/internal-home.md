---
description: Internal home screen contract for the role-aware workspace landing page.
purpose: Read before changing dashboard composition, shell-linked entry points, or role-aware home behavior.
status: Active
date: 2026-03-09
screen_id: SCR-APP-HOME
route: /
actors:
  - employee
  - manager
  - hr_admin
  - hr_reader
test_id_scope: scr-app-home
implementation_files:
  - apps/web/src/app/page.tsx
  - apps/web/src/features/app-shell/components/internal-app-shell.tsx
test_files:
  - apps/web/playwright/tests/ft-0111-app-shell.spec.ts
  - apps/web/playwright/tests/ft-0112-role-home-dashboards.spec.ts
  - apps/web/playwright/tests/ft-0213-shell-identity-chrome.spec.ts
---

# Screen spec — Internal home
Status: Active (2026-03-09)

## Purpose
Role-aware landing page после входа и выбора компании.

## Information blocks
- workspace shell and account/company chrome;
- hero summary with role-appropriate context;
- role-aware tasks, shortcuts, and activity blocks;
- navigation entry points into questionnaires, results, and HR surfaces.

## Primary actions
- continue into the most relevant workspace flow for current role;
- open key shortcuts from dashboard cards/sections.

## Secondary actions
- switch company;
- open account/help/notification controls from shell chrome.

## States
- employee home;
- manager home;
- hr_admin/hr_reader home;
- loading/empty/error shell states.

## Domain-specific behavior
- content varies by role without changing active company context;
- shell remains the same workspace container across protected routes;
- home should surface pending work, not hide domain-critical deadlines/statuses.

## Implementation entrypoints
- `apps/web/src/app/page.tsx`
- `apps/web/src/features/app-shell/components/internal-app-shell.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0111-app-shell.spec.ts`
- `apps/web/playwright/tests/ft-0112-role-home-dashboards.spec.ts`
- `apps/web/playwright/tests/ft-0213-shell-identity-chrome.spec.ts`
