---
description: Questionnaire fill screen contract for answering, saving drafts, and submitting.
purpose: Read before changing questionnaire UX, automation, or domain-sensitive form behavior.
status: Active
date: 2026-03-09
screen_id: SCR-QUESTIONNAIRES-FILL
route: /questionnaires/[questionnaireId]
actors:
  - questionnaire_assignee
test_id_scope: scr-questionnaires-fill
implementation_files:
  - apps/web/src/app/questionnaires/[questionnaireId]/page.tsx
test_files:
  - apps/web/playwright/tests/ft-0132-questionnaire-fill-flow.spec.ts
  - apps/web/playwright/tests/ft-0133-questionnaire-readonly.spec.ts
  - apps/web/playwright/tests/ft-0215-content-first-surfaces.spec.ts
---

# Screen spec — Questionnaire fill
Status: Active (2026-03-09)

## Purpose
Заполнение анкеты оценки сотрудника.

## Information blocks
- competency sections;
- score inputs / level inputs;
- comments;
- progress;
- save draft / submit;
- read-only state after submit or ended campaign.

## Primary actions
- answer indicators or levels;
- save draft;
- submit questionnaire.

## Secondary actions
- inspect remaining progress and context such as subject/campaign.

## States
- editable draft;
- partially completed draft;
- submitted/read-only;
- campaign-ended read-only;
- validation errors.

## Domain-specific behavior
- comments are optional;
- indicators mode uses 1..5 + N/A;
- levels mode emphasizes level choice/distribution semantics and should not pretend to be an average-based score entry surface;
- first draft save may contribute to campaign lock semantics elsewhere.

## Implementation entrypoints
- `apps/web/src/app/questionnaires/[questionnaireId]/page.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0132-questionnaire-fill-flow.spec.ts`
- `apps/web/playwright/tests/ft-0133-questionnaire-readonly.spec.ts`
- `apps/web/playwright/tests/ft-0215-content-first-surfaces.spec.ts`
