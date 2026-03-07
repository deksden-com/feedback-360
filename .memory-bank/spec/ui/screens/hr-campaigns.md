---
screen_id: SCR-HR-CAMPAIGNS
route: /hr/campaigns
actors:
  - hr_admin
  - hr_reader
test_id_scope: scr-hr-campaigns
---

# Screen spec — HR campaigns
Status: Draft (2026-03-07)

Экран: список и portfolio overview кампаний HR.

Что внутри:
- page header и summary counters по статусам;
- filters/search;
- main campaign list/cards;
- primary CTA создания кампании;
- links to campaign detail/results actions.

Ключевые состояния:
- mixed statuses list;
- empty company without campaigns;
- filters narrowing campaign set;
- read-only role (`hr_reader`) without create/edit actions.

Зачем читать:
- чтобы campaign list screenshots, docs и tests ссылались на один portfolio surface;
- чтобы content-first redesign не потерял operational actions HR.
