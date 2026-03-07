---
screen_id: SCR-HR-EMPLOYEES
route: /hr/employees
actors:
  - hr_admin
  - hr_reader
test_id_scope: scr-hr-employees
---

# Screen spec — HR employees
Status: Draft (2026-03-07)

Экран: каталог сотрудников компании для HR.

Что внутри:
- summary block с количеством активных сотрудников и состоянием справочника;
- CRUD toolbar с поиском, фильтрами и primary CTA создания;
- список сотрудников с identity-first строками/карточками;
- переход к профилю сотрудника.

Ключевые состояния:
- populated catalog;
- filtered/search state;
- empty results state;
- read-only role (`hr_reader`) without destructive actions.

Зачем читать:
- чтобы guides, screenshots и Playwright/XE ссылались на единый contract employee directory;
- чтобы UI polish сохранял familiar CRUD behavior, а не только внешний вид.
