---
description: HR model create screen contract for creating a new draft competency model version.
purpose: Read before changing model creation UX or the first step of the model-editing flow.
status: Active
date: 2026-03-09
screen_id: SCR-HR-MODEL-CREATE
route: /hr/models/new
actors:
  - hr_admin
test_id_scope: scr-hr-model-create
implementation_files:
  - apps/web/src/app/hr/models/new/page.tsx
test_files:
  - apps/web/playwright/tests/ft-0172-model-editor.spec.ts
---

# Screen spec — HR model create
Status: Active (2026-03-09)

## Purpose
Создание новой draft-версии модели компетенций.

## Information blocks
- mode choice (`indicators` / `levels`);
- initial model metadata;
- first group/competency scaffolding inputs.

## Primary actions
- create draft model;
- continue into model detail/editor.

## Secondary actions
- cancel and return to model catalog.

## States
- empty create form;
- validation errors;
- successful create redirect;
- admin-only access.

## Domain-specific behavior
- created model starts as draft;
- downstream campaigns should only use explicit model versions, not mutable abstract models.

## Implementation entrypoints
- `apps/web/src/app/hr/models/new/page.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0172-model-editor.spec.ts`
