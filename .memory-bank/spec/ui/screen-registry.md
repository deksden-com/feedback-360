# Screen registry
Status: Draft (2026-03-07)

Цель: дать каждому экрану канонический `screen_id`, чтобы связывать:
- screen specs,
- POM mapping,
- `data-testid`,
- guides/tutorials/how-to,
- screenshots/evidence,
- код экранов и крупных screen-level components.

Связанные документы:
- [UI design principles](design-principles.md) — общие продуктовые принципы редизайна и composition rules. Читать, чтобы registry не был абстрактным списком, а привязывался к реальным surfaces.
- [POM conventions](pom/conventions.md) — naming и правила `data-testid`/POM. Читать, чтобы `screen_id` и test-id scope использовались согласованно.
- [Coding style](../engineering/coding-style.md) — проектные правила аннотаций в коде и UI conventions. Читать, чтобы `@screenId` / `@testIdScope` применялись одинаково в `apps/web`.

## Naming rule
- формат `screen_id`: `SCR-<AREA>-<NAME>`
- uppercase, kebab-like semantic segments через `-`
- screen id должен описывать **screen surface**, а не конкретную роль файла в коде

Примеры:
- `SCR-AUTH-LOGIN`
- `SCR-COMPANY-SWITCHER`
- `SCR-APP-HOME`
- `SCR-HR-EMPLOYEES`
- `SCR-HR-EMPLOYEE-DETAIL`
- `SCR-HR-ORG`
- `SCR-HR-MODELS`
- `SCR-HR-CAMPAIGNS`
- `SCR-HR-CAMPAIGN-DETAIL`
- `SCR-HR-CAMPAIGN-MATRIX`
- `SCR-QUESTIONNAIRES-INBOX`
- `SCR-QUESTIONNAIRES-FILL`
- `SCR-RESULTS-EMPLOYEE`
- `SCR-RESULTS-MANAGER`
- `SCR-RESULTS-HR`
- `SCR-HR-NOTIFICATIONS`
- `SCR-OPS`

## Canonical registry
| screen_id | Route | Actors | Screen spec | testIdScope |
|---|---|---|---|---|
| `SCR-AUTH-LOGIN` | `/auth/login` | guest | planned | `scr-auth-login` |
| `SCR-AUTH-CALLBACK` | `/auth/callback` | guest | planned | `scr-auth-callback` |
| `SCR-COMPANY-SWITCHER` | `/select-company` | authenticated user | planned | `scr-company-switcher` |
| `SCR-APP-HOME` | `/` | employee, manager, hr_admin, hr_reader | [Internal home](screens/internal-home.md) | `scr-app-home` |
| `SCR-HR-EMPLOYEES` | `/hr/employees` | hr_admin, hr_reader | [HR employees](screens/hr-employees.md) | `scr-hr-employees` |
| `SCR-HR-EMPLOYEE-DETAIL` | `/hr/employees/[employeeId]` | hr_admin, hr_reader | [HR employee detail](screens/hr-employee-detail.md) | `scr-hr-employee-detail` |
| `SCR-HR-EMPLOYEE-CREATE` | `/hr/employees/new` | hr_admin | planned | `scr-hr-employee-create` |
| `SCR-HR-ORG` | `/hr/org` | hr_admin, hr_reader | [HR org](screens/hr-org.md) | `scr-hr-org` |
| `SCR-HR-MODELS` | `/hr/models` | hr_admin, hr_reader | planned | `scr-hr-models` |
| `SCR-HR-MODEL-DETAIL` | `/hr/models/[modelVersionId]` | hr_admin, hr_reader | planned | `scr-hr-model-detail` |
| `SCR-HR-MODEL-CREATE` | `/hr/models/new` | hr_admin | planned | `scr-hr-model-create` |
| `SCR-HR-CAMPAIGNS` | `/hr/campaigns` | hr_admin, hr_reader | [HR campaigns](screens/hr-campaigns.md) | `scr-hr-campaigns` |
| `SCR-HR-CAMPAIGN-CREATE` | `/hr/campaigns/new` | hr_admin | planned | `scr-hr-campaign-create` |
| `SCR-HR-CAMPAIGN-DETAIL` | `/hr/campaigns/[campaignId]` | hr_admin, hr_reader | [HR campaign detail](screens/hr-campaign-detail.md) | `scr-hr-campaign-detail` |
| `SCR-HR-CAMPAIGN-EDIT` | `/hr/campaigns/[campaignId]/edit` | hr_admin | planned | `scr-hr-campaign-edit` |
| `SCR-HR-CAMPAIGN-MATRIX` | `/hr/campaigns/[campaignId]/matrix` | hr_admin, hr_reader | planned | `scr-hr-campaign-matrix` |
| `SCR-QUESTIONNAIRES-INBOX` | `/questionnaires` | employee, manager, hr_admin, hr_reader | [Questionnaire inbox](screens/questionnaire-inbox.md) | `scr-questionnaires-inbox` |
| `SCR-QUESTIONNAIRES-FILL` | `/questionnaires/[questionnaireId]` | questionnaire assignee | [Questionnaire fill](screens/questionnaire-fill.md) | `scr-questionnaires-fill` |
| `SCR-RESULTS-EMPLOYEE` | `/results` | employee | [Employee results dashboard](screens/employee-results-dashboard.md) | `scr-results-employee` |
| `SCR-RESULTS-MANAGER` | `/results/team` | manager | [Manager results dashboard](screens/manager-results-dashboard.md) | `scr-results-manager` |
| `SCR-RESULTS-HR` | `/results/hr` | hr_admin, hr_reader | [HR results workbench](screens/hr-results-workbench.md) | `scr-results-hr` |
| `SCR-HR-NOTIFICATIONS` | `/hr/notifications` | hr_admin, hr_reader | planned | `scr-hr-notifications` |
| `SCR-OPS` | `/ops` | hr_admin, hr_reader | planned | `scr-ops` |
| `SCR-SENTRY-EXAMPLE` | `/sentry-example-page` | developer | planned | `scr-sentry-example` |

## Usage rules
### Markdown docs
- screen spec file uses frontmatter field `screen_id`
- guide/tutorial/how-to/explanation files use `screen_ids` when they mention multiple surfaces

### Screenshots
- screenshot filenames include canonical screen id as suffix:
  - `step-02-employees__(SCR-HR-EMPLOYEES).png`
  - `step-10a-results__(SCR-RESULTS-EMPLOYEE).png`

### Code annotations
- screen-level React page/container uses JSDoc tag `@screenId`
- same surface may additionally declare `@testIdScope`

### Automation
- POM mapping refers to `screen_id`
- `data-testid` values are derived from `testIdScope`

## Maintenance rule
Когда появляется новый route-level screen:
1. добавить его в registry;
2. назначить `screen_id` и `testIdScope`;
3. обновить `screen spec`/`POM mapping`;
4. использовать этот id в guides/screenshots/evidence.
