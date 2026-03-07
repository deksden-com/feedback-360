---
screen_id: SCR-RESULTS-HR
route: /results/hr
actors:
  - hr_admin
  - hr_reader
test_id_scope: scr-results-hr
---

# Screen spec — HR results workbench
Status: Draft (2026-03-07)

Экран: HR-facing workbench результатов кампаний.

Что внутри:
- summary hero/results overview;
- rich group and competency sections;
- processed insights and, where policy allows, raw/original comment visibility;
- filters/switchers по subject/campaign.

Ключевые состояния:
- `hr_admin` with full visibility;
- `hr_reader` without raw-only/destructive actions;
- completed vs in-progress results availability.

Зачем читать:
- чтобы HR screenshots, guides и XE/assertions ссылались на один results workbench contract;
- чтобы later UI polish не смешивал HR-only visibility с employee/manager surfaces.
