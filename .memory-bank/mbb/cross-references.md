# MBB — Cross-references (code ↔ docs)
Status: Updated (2026-03-09)

Cross-references нужны, чтобы документация и код не расходились в разные стороны. Цель простая: из кода должно быть понятно, где нормативный документ, а из документации — где живёт реальная реализация и чем она подтверждена.

## Что хотим получить

Двустороннюю навигацию:
- **Code → docs**: разработчик или агент быстро находит spec / ADR / feature doc / screen spec;
- **Docs → code**: из SSoT видно, где основной implementation path, tests и entrypoints.

## Code → docs

### Базовые JSDoc-теги

Используем:
- `@docs` — основной нормативный документ по модулю/экрану/слайсу
- `@see` — смежные документы, ADR, тесты, screen specs, scenarios
- `@screenId` — канонический экранный ID для route-level UI или screen-level container
- `@testIdScope` — канонический scope для `data-testid`

### Где это обязательно особенно полезно

- root composition points;
- feature-area entrypoints;
- shared modules с неочевидной зоной ответственности;
- route-level page components;
- screen-level UI containers;
- POM classes и browser helpers.

### Пример: backend entrypoint

```ts
/**
 * Results feature dispatch entrypoint.
 * @docs .memory-bank/spec/domain/results/results.md
 * @see .memory-bank/adr/0004-feature-area-slicing-boundaries.md
 * @see .memory-bank/plans/epics/EP-015-results-experience/index.md
 */
```

### Пример: screen component

```ts
/**
 * HR employee directory page.
 * @docs .memory-bank/spec/ui/screens/hr-employees.md
 * @screenId SCR-HR-EMPLOYEES
 * @testIdScope scr-hr-employees
 * @see .memory-bank/spec/ui/screen-registry.md
 * @see .memory-bank/spec/ui/test-id-registry.md
 */
```

## Docs → code

В документации ссылки на код нужны не для перечисления файлов ради перечисления, а чтобы:
- показать owning implementation path;
- показать where to look first;
- показать test coverage and evidence paths.

### Где это особенно важно
- subsystem/component docs;
- feature docs;
- screen specs;
- XE/runtime docs;
- troubleshooting docs.

### Что стоит ссылать
- основной entrypoint реализации;
- связанные тесты;
- иногда — ключевой composition point или adapter, если без него трудно понять сборку фичи.

### Пример формулировки

- `apps/web/src/app/hr/employees/page.tsx`: route-level entrypoint каталога сотрудников. Читать, чтобы увидеть текущую композицию screen-level UI и как экран подключён к shell/navigation.
- `packages/core/src/features/results.ts`: основной owning module для results feature area. Читать, чтобы понять, где живут use-cases и границы доменной логики.

## Screen traceability

Для UI у нас действует дополнительный слой связей:
- `screen-registry.md` — канонический `screen_id`;
- `test-id-registry.md` — канонический `testIdScope`;
- `spec/ui/screens/*` — screen contract;
- `spec/ui/pom/*` — POM mapping;
- screenshot filenames — suffix `__(SCR-...)`;
- guides/tutorials/how-to — `screen_ids` в frontmatter.

Это и есть наш screen-level cross-reference graph. Если экран меняется, impact analysis начинается от `screen_id`, а не от догадок.

## Cross-references и планы

Для планов правило такое:
- epic должен ссылаться на ключевые subsystem/spec docs;
- feature должна ссылаться на SSoT docs + implementation paths + tests/evidence;
- XE scenario должен ссылаться на screen specs, POM contracts и scenario/runtime specs.

То есть `plans/` не должен жить отдельно от `spec/` и кода.

## Cross-references и evidence

Если в документе есть:
- screenshot,
- beta walkthrough,
- XE verification,
- CI/CD evidence,

он должен быть связан с соответствующим экраном/фичей/сценарием так, чтобы по нему можно было быстро найти:
- какой экран это иллюстрирует;
- какой FT/EP/XE это подтверждает;
- где лежит код.

## Practical rules

### Когда добавляем новый module/screen
- добавляем или обновляем `@docs` / `@screenId` / `@testIdScope`;
- проверяем, что screen registry и screen spec актуальны;
- при необходимости обновляем guides/evidence.

### Когда добавляем новый spec
- даём ссылки на owning code/tests, если они уже существуют;
- если реализации ещё нет, связываем хотя бы с epic/feature plan.

### Когда делаем refactor
- обновляем cross-links в том же changeset;
- если old paths ушли, ссылки не должны оставаться “мертвыми обещаниями”.

## Антипаттерны

Плохо:
- документ есть, но из кода до него не добраться;
- screen spec существует, но `screen_id` отсутствует в коде и guides;
- feature doc ссылается на абстрактную область, но не на реальный implementation path;
- evidence живёт само по себе, без связи с FT/EP/screen.

## Мини-чеклист

- [ ] Из кода можно найти нормативный doc
- [ ] Из нормативного doc можно найти owning implementation path
- [ ] Для UI экранов совпадают `screen_id`, `testIdScope`, docs и screenshots
- [ ] План, код и evidence связаны одной трассировкой
