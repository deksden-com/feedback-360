# Test ID registry
Status: Draft (2026-03-07)

Цель: зафиксировать связь между `screen_id` и `data-testid`, чтобы automation, XE, guides и UI refactor опирались на один стабильный naming contract.

Связанные документы:
- [Screen registry](screen-registry.md) — канонические `screen_id`, routes и `testIdScope`. Читать первым, потому что test ids выводятся именно из registry, а не придумываются локально.
- [POM conventions](pom/conventions.md) — правила использования stable selectors и page objects. Читать, чтобы registry был practically usable для Playwright/XE.
- [UI automation contract](../testing/ui-automation-contract.md) — как screen specs, POM и `data-testid` работают вместе в XE. Читать, чтобы понимать роль registry в end-to-end automation.

## Naming rule
- каждый route-level screen имеет `testIdScope` вида `scr-...`
- screen-root test id:
  - `<scope>-root`
- children:
  - `<scope>-toolbar`
  - `<scope>-search`
  - `<scope>-filter-status`
  - `<scope>-create`
  - `<scope>-row`
  - `<scope>-row-open`

То есть используем простой deterministic kebab-case, а не ad-hoc названия.

## Examples
### `SCR-HR-EMPLOYEES`
- scope: `scr-hr-employees`
- examples:
  - `scr-hr-employees-root`
  - `scr-hr-employees-toolbar`
  - `scr-hr-employees-search`
  - `scr-hr-employees-filter-status`
  - `scr-hr-employees-create`
  - `scr-hr-employees-row`
  - `scr-hr-employees-row-open`

### `SCR-QUESTIONNAIRES-FILL`
- scope: `scr-questionnaires-fill`
- examples:
  - `scr-questionnaires-fill-root`
  - `scr-questionnaires-fill-progress`
  - `scr-questionnaires-fill-competency`
  - `scr-questionnaires-fill-save-draft`
  - `scr-questionnaires-fill-submit`

## Required elements rule
Для каждого ключевого экрана должны быть стабильные test ids минимум для:
- root container;
- primary CTA;
- primary filters/switchers;
- row/card/list unit;
- main status/progress block;
- assertion-critical text or state targets.

## Registry maintenance
Полный построчный список test ids можно держать в POM mapping или screen-level automation docs. Этот registry фиксирует именно **модель именования** и обязательные root patterns.

Если на экране появляется новый ключевой interactive element:
1. проверить `screen_id` и `testIdScope` в [Screen registry](screen-registry.md);
2. выбрать имя по общему паттерну;
3. при необходимости добавить в POM/screen spec high-level action or assertion target.
