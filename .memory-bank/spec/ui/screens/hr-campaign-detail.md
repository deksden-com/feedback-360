---
screen_id: SCR-HR-CAMPAIGN-DETAIL
route: /hr/campaigns/[campaignId]
actors:
  - hr_admin
  - hr_reader
test_id_scope: scr-hr-campaign-detail
---

# Screen spec — HR campaign detail
Status: Draft (2026-03-07)

Экран: operational detail кампании.

Что внутри:
- summary hero со статусом, сроками, progress, lock и AI state;
- operational sections: participants, assignments/matrix, reminders, results entry points;
- secondary diagnostics/actions.

Ключевые состояния:
- draft campaign;
- started campaign;
- ended/processing/completed campaign;
- locked-after-first-draft-save note;
- read-only role (`hr_reader`) without destructive actions.

Зачем читать:
- чтобы detail screenshots и campaign walkthrough имели единый SSoT surface;
- чтобы UI changes сохраняли operational смысл detail page, а не только визуальный слой.
