---
description: HR model detail screen contract for viewing and editing a specific model version.
purpose: Read before changing model editor UX, draft/published states, or related automation.
status: Active
date: 2026-03-09
screen_id: SCR-HR-MODEL-DETAIL
route: /hr/models/[modelVersionId]
actors:
  - hr_admin
  - hr_reader
test_id_scope: scr-hr-model-detail
implementation_files:
  - apps/web/src/app/hr/models/[modelVersionId]/page.tsx
test_files:
  - apps/web/playwright/tests/ft-0172-model-editor.spec.ts
---

# Screen spec — HR model detail
Status: Active (2026-03-09)

## Purpose
Редактирование и просмотр конкретной версии модели компетенций.

## Information blocks
- model summary and mode;
- competency groups and weights;
- competencies with indicators or levels;
- validation feedback for completeness and weights.

## Primary actions
- edit draft model;
- publish draft or clone to new draft where supported.

## Secondary actions
- navigate back to model catalog;
- inspect derived matrix/questionnaire implications conceptually.

## States
- draft editable;
- published/read-only;
- validation errors;
- `hr_reader` read-only mode.

## Domain-specific behavior
- indicators model uses `1..5 + N/A`;
- levels model uses `1..4 + unsure`, with distribution-first interpretation in downstream results;
- published model versions should be stable references for campaigns.

## Implementation entrypoints
- `apps/web/src/app/hr/models/[modelVersionId]/page.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0172-model-editor.spec.ts`
