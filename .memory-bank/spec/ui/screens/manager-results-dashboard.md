---
screen_id: SCR-RESULTS-MANAGER
route: /results/team
actors:
  - manager
test_id_scope: scr-results-manager
---

# Screen spec — Manager results dashboard
Status: Draft (2026-03-07)

Экран: manager-facing team/results dashboard.

Что внутри:
- summary hero для выбранного сотрудника/команды;
- role-safe group cards и competency blocks;
- visibility notes по anonymity/hidden groups;
- navigation between available team members.

Ключевые состояния:
- employee selected with visible team data;
- hidden/merged group explanation;
- no available team results yet.

Зачем читать:
- чтобы manager screenshots, guides и acceptance tests сверялись с единым contract surface;
- чтобы redesign results для руководителя не нарушал anonymity/visibility constraints.
