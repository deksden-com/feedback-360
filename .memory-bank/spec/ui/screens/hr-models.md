---
description: HR models screen contract for the competency model catalog surface.
purpose: Read before changing model catalog UX, filters, or model portfolio walkthroughs.
status: Active
date: 2026-03-09
screen_id: SCR-HR-MODELS
route: /hr/models
actors:
  - hr_admin
  - hr_reader
test_id_scope: scr-hr-models
implementation_files:
  - apps/web/src/app/hr/models/page.tsx
test_files:
  - apps/web/playwright/tests/ft-0171-model-catalog.spec.ts
---

# Screen spec — HR models
Status: Active (2026-03-09)

## Purpose
Каталог моделей компетенций и версий для HR.

## Information blocks
- list/catalog of model versions;
- summary of model mode (`indicators` / `levels`);
- draft/published state cues;
- entrypoints to create, inspect, and duplicate/edit versions.

## Primary actions
- open model detail;
- create new model draft.

## Secondary actions
- filter/search models;
- compare draft vs published versions when supported.

## States
- populated catalog;
- empty state with create CTA;
- read-only behavior for `hr_reader`.

## Domain-specific behavior
- campaign references a concrete `model_version_id`;
- once campaign is started, linked model version becomes immutable for that campaign;
- `levels` surfaces must preserve distribution-first semantics, not fake averages.

## Implementation entrypoints
- `apps/web/src/app/hr/models/page.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0171-model-catalog.spec.ts`
