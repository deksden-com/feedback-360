---
screen_id: SCR-HR-ORG
route: /hr/org
actors:
  - hr_admin
  - hr_reader
test_id_scope: scr-hr-org
---

# Screen spec — HR org
Status: Draft (2026-03-07)

Экран: оргструктура компании и selected-node detail pane.

Что внутри:
- дерево подразделений;
- selected department summary;
- manager/member cards;
- actions по работе с иерархией и привязкой сотрудников.

Ключевые состояния:
- no departments yet;
- selected department with members;
- selected department without manager;
- read-only role (`hr_reader`) without destructive changes.

Зачем читать:
- чтобы hierarchy walkthrough, screenshots и automation использовали единый contract org editor;
- чтобы visual hierarchy changes не ломали смысл selected-node workflow.
