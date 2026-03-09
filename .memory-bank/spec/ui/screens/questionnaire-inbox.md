---
description: Questionnaire inbox screen contract for assigned questionnaire discovery and entry.
purpose: Read before changing inbox UX, status summaries, or questionnaire opening flows.
status: Active
date: 2026-03-09
screen_id: SCR-QUESTIONNAIRES-INBOX
route: /questionnaires
actors:
  - employee
  - manager
  - hr_admin
  - hr_reader
test_id_scope: scr-questionnaires-inbox
implementation_files:
  - apps/web/src/app/questionnaires/page.tsx
test_files:
  - apps/web/playwright/tests/ft-0131-questionnaire-inbox.spec.ts
  - apps/web/playwright/tests/ft-0215-content-first-surfaces.spec.ts
---

# Screen spec — Questionnaire inbox
Status: Active (2026-03-09)

## Purpose
Список назначенных пользователю анкет.

## Information blocks
- counters по статусам;
- фильтры;
- список карточек/строк;
- CTA открыть/продолжить анкету.

## Primary actions
- filter or switch between questionnaire states;
- open a questionnaire.

## Secondary actions
- inspect campaign/subject metadata before opening.

## States
- mixed questionnaire statuses;
- empty inbox;
- read-only/completed items present among editable ones.

## Domain-specific behavior
- inbox reflects only questionnaires assigned to current actor;
- status transitions (`not_started`, `in_progress`, `submitted`) must be readable here before user enters the form.

## Implementation entrypoints
- `apps/web/src/app/questionnaires/page.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0131-questionnaire-inbox.spec.ts`
- `apps/web/playwright/tests/ft-0215-content-first-surfaces.spec.ts`
