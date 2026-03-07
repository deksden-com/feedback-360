---
screen_id: SCR-QUESTIONNAIRES-INBOX
route: /questionnaires
actors:
  - employee
  - manager
  - hr_admin
  - hr_reader
test_id_scope: scr-questionnaires-inbox
---

# Screen spec — Questionnaire inbox
Status: Draft (2026-03-07)

Экран: список назначенных пользователю анкет.

Что внутри:
- counters по статусам
- фильтры
- список карточек/строк
- CTA открыть/продолжить анкету

Зачем читать:
- чтобы XE и e2e-сценарии одинаково понимали, как actor находит нужную анкету;
- чтобы test ids и POM опирались на стабильный contract экрана.
