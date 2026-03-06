# RBAC (roles × actions)
Status: Draft (2026-03-03)

Роли:
- `hr_admin`
- `hr_reader`
- `manager`
- `employee`

Принципы:
- Доступ к данным всегда scoped на `company_id`.
- HR Reader остаётся read-only HR ролью, но не получает raw-комментарии; raw open text доступен только `hr_admin`.

Ссылки (аннотированные):
- [Operation catalog](../client-api/operation-catalog.md): SSoT списка операций и их roles. Читать, чтобы права были привязаны к конкретным ops, а не к “словесным” действиям.
- [Results visibility](../domain/results-visibility.md): кто видит raw vs processed open text. Читать, чтобы RBAC и приватность не противоречили друг другу.
- [Seed S1_company_roles_min](../testing/seeds/s1-company-roles-min.md): роли и users для RBAC тестов. Читать, чтобы проверки прав можно было автоматизировать детерминированно.

## Action groups (MVP)
Действия (группы), которые нам важны в MVP:
- `manage_directory`: CRUD employees (HR-справочник), soft delete.
- `manage_org`: departments, manager relations, history.
- `manage_models`: создание версий моделей (indicators/levels).
- `manage_campaigns`: create/start/stop/end, менять settings в draft.
- `manage_matrix`: generateSuggested/set (до lock).
- `manage_notifications`: генерировать reminders, dispatch outbox (ручной запуск).
- `run_ai`: запуск AI обработки и retry.
- `fill_questionnaires`: list/saveDraft/submit своих назначенных анкет.
- `view_results_self`: employee dashboard.
- `view_results_team`: manager/team view.
- `view_results_hr`: HR view (самая полная).

## Role matrix (MVP)
- `hr_admin`:
  - разрешено: все action groups.
- `hr_reader`:
  - разрешено: `view_results_hr` (без raw open text), `view_results_team` (если нужно), `view_results_self` (как обычный пользователь).
  - запрещено: любые `manage_*`, `run_ai`.
- `manager`:
  - разрешено: `fill_questionnaires`, `view_results_self`, `view_results_team`.
  - запрещено: `view_results_hr`, любые `manage_*`, `run_ai`.
- `employee`:
  - разрешено: `fill_questionnaires`, `view_results_self`.
  - запрещено: `view_results_team`, `view_results_hr`, любые `manage_*`, `run_ai`.

## Mapping: ops → roles (SSoT)
В MVP считаем, что права на конкретные операции — это SSoT в каталоге операций:
- `spec/client-api/operation-catalog.md` содержит строку `roles:` для каждой operation.

Этот документ (RBAC) задаёт “почему и в каком объёме”, а каталог операций — “точно какие ops”.

## Test expectations
- Любая операция, вызванная ролью без прав, возвращает typed error `code=forbidden` (см. `spec/client-api/errors.md`).
