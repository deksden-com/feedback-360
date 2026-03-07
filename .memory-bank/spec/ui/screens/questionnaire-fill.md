---
screen_id: SCR-QUESTIONNAIRES-FILL
route: /questionnaires/[questionnaireId]
actors:
  - questionnaire_assignee
test_id_scope: scr-questionnaires-fill
---

# Screen spec — Questionnaire fill
Status: Draft (2026-03-07)

Экран: заполнение анкеты оценки сотрудника.

Что внутри:
- competency sections
- score inputs / level inputs
- comments
- progress
- save draft / submit
- read-only state after submit or ended campaign

Зачем читать:
- чтобы GUI-фазы XE и обычные acceptance tests использовали один контракт поведения;
- чтобы не дублировать в сценариях детали формы и состояний.
