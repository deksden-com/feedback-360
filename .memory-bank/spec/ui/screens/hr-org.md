---
description: HR org screen contract for department hierarchy and selected-node detail workflow.
purpose: Read before changing org hierarchy UX, node detail panes, or related automation.
status: Active
date: 2026-03-09
screen_id: SCR-HR-ORG
route: /hr/org
actors:
  - hr_admin
  - hr_reader
test_id_scope: scr-hr-org
implementation_files:
  - apps/web/src/app/hr/org/page.tsx
test_files:
  - apps/web/playwright/tests/ft-0163-org-editor.spec.ts
  - apps/web/playwright/tests/ft-0214-hr-crud-hierarchy-polish.spec.ts
---

# Screen spec — HR org
Status: Active (2026-03-09)

## Purpose
Оргструктура компании и selected-node detail pane.

## Information blocks
- дерево подразделений;
- selected department summary;
- manager/member cards;
- actions по работе с иерархией и привязкой сотрудников.

## Primary actions
- navigate hierarchy;
- inspect selected department;
- add/edit org relations when allowed.

## Secondary actions
- jump into employee/profile follow-ups.

## States
- no departments yet;
- selected department with members;
- selected department without manager;
- read-only role (`hr_reader`) without destructive changes.

## Domain-specific behavior
- org editor reflects latest org state, while campaigns later snapshot it;
- hierarchy should visually preserve parent/child relationships clearly;
- manager relations and department history changes affect downstream auto-generation flows.

## Implementation entrypoints
- `apps/web/src/app/hr/org/page.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0163-org-editor.spec.ts`
- `apps/web/playwright/tests/ft-0214-hr-crud-hierarchy-polish.spec.ts`
