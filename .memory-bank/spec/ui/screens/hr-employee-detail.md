---
screen_id: SCR-HR-EMPLOYEE-DETAIL
route: /hr/employees/[employeeId]
actors:
  - hr_admin
  - hr_reader
test_id_scope: scr-hr-employee-detail
---

# Screen spec — HR employee detail
Status: Draft (2026-03-07)

Экран: профиль сотрудника в HR-справочнике.

Что внутри:
- summary hero с identity, ролью, подразделением и manager context;
- provisioning and membership summary;
- history/changes sections;
- переходы назад в directory и к связанным HR flows.

Ключевые состояния:
- active employee;
- inactive/soft-deleted marker;
- missing manager/department history;
- read-only role (`hr_reader`) without edit actions.

Зачем читать:
- чтобы screenshots employee profile, guides и acceptance tests проверяли один screen contract;
- чтобы profile polish не скрывал history/provisioning данные, важные для HR.
