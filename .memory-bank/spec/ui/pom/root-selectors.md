# Root selectors for governed screens
Status: Active (2026-03-09)

Этот документ фиксирует derived runtime root selectors для route-level screens. Он нужен как bridge между `screen-registry`, `testIdScope`, route page code и будущими/текущими POM lookup rules.

Связанные документы:
- [Screen registry](../screen-registry.md) — канонические `screen_id`, routes и `testIdScope`. Читать первым, потому что root selectors derive only from registry scopes.
- [Test ID registry](../test-id-registry.md) — naming contract и governed runtime rule. Читать, чтобы root selector не выглядел ad-hoc исключением.
- [UI automation contract](../../testing/ui-automation-contract.md) — зачем root selector нужен XE/POM/e2e tooling. Читать, если правим audits или browser automation contracts.

## Derivation rule
- `rootTestId = \`${testIdScope}-root\``

## Governed root selectors
| screen_id | testIdScope | root selector |
|---|---|---|
| `SCR-AUTH-LOGIN` | `scr-auth-login` | `scr-auth-login-root` |
| `SCR-AUTH-CALLBACK` | `scr-auth-callback` | `scr-auth-callback-root` |
| `SCR-COMPANY-SWITCHER` | `scr-company-switcher` | `scr-company-switcher-root` |
| `SCR-APP-HOME` | `scr-app-home` | `scr-app-home-root` |
| `SCR-HR-EMPLOYEES` | `scr-hr-employees` | `scr-hr-employees-root` |
| `SCR-HR-EMPLOYEE-DETAIL` | `scr-hr-employee-detail` | `scr-hr-employee-detail-root` |
| `SCR-HR-EMPLOYEE-CREATE` | `scr-hr-employee-create` | `scr-hr-employee-create-root` |
| `SCR-HR-ORG` | `scr-hr-org` | `scr-hr-org-root` |
| `SCR-HR-MODELS` | `scr-hr-models` | `scr-hr-models-root` |
| `SCR-HR-MODEL-DETAIL` | `scr-hr-model-detail` | `scr-hr-model-detail-root` |
| `SCR-HR-MODEL-CREATE` | `scr-hr-model-create` | `scr-hr-model-create-root` |
| `SCR-HR-CAMPAIGNS` | `scr-hr-campaigns` | `scr-hr-campaigns-root` |
| `SCR-HR-CAMPAIGN-CREATE` | `scr-hr-campaign-create` | `scr-hr-campaign-create-root` |
| `SCR-HR-CAMPAIGN-DETAIL` | `scr-hr-campaign-detail` | `scr-hr-campaign-detail-root` |
| `SCR-HR-CAMPAIGN-EDIT` | `scr-hr-campaign-edit` | `scr-hr-campaign-edit-root` |
| `SCR-HR-CAMPAIGN-MATRIX` | `scr-hr-campaign-matrix` | `scr-hr-campaign-matrix-root` |
| `SCR-QUESTIONNAIRES-INBOX` | `scr-questionnaires-inbox` | `scr-questionnaires-inbox-root` |
| `SCR-QUESTIONNAIRES-FILL` | `scr-questionnaires-fill` | `scr-questionnaires-fill-root` |
| `SCR-RESULTS-EMPLOYEE` | `scr-results-employee` | `scr-results-employee-root` |
| `SCR-RESULTS-MANAGER` | `scr-results-manager` | `scr-results-manager-root` |
| `SCR-RESULTS-HR` | `scr-results-hr` | `scr-results-hr-root` |
| `SCR-HR-NOTIFICATIONS` | `scr-hr-notifications` | `scr-hr-notifications-root` |
| `SCR-OPS` | `scr-ops` | `scr-ops-root` |
| `SCR-SENTRY-EXAMPLE` | `scr-sentry-example` | `scr-sentry-example-root` |

## Maintenance rule
Когда меняется `testIdScope` или появляется новый route-level screen:
1. обновить `screen-registry.md`;
2. обновить этот root-selector mapping;
3. убедиться, что route page реально рендерит derived selector;
4. прогнать `pnpm docs:audit`.
