# UI automation contract for XE
Status: Draft (2026-03-07)

Цель: сделать GUI-фазы XE стабильными и воспроизводимыми при эволюции интерфейса.

## Источники истины
- screen specs — нормативное описание экранов, их структуры, действий и состояний;
- screen registry — канонические `screen_id` и `testIdScope`;
- POM mapping — техническая привязка screen specs к runtime automation API;
- `data-testid` — стабильные идентификаторы для интерактивных и проверяемых элементов.

## Browser session strategy
Для XE используем:
- **1 actor = 1 storage state = 1 browser context**

Почему:
- сессии изолированы естественным образом;
- logout одного actor не ломает других;
- проще моделировать последовательные действия HR/manager/employee;
- storage state можно детерминированно поднимать без GUI login flow.

## Auth bootstrap
Для XE разрешён test-only auth bootstrap в `local` и `beta`:
- раннер получает bootstrap/session material для actor;
- создаёт обычную browser session;
- после этого actor работает как обычный пользователь;
- logout завершает эту session стандартным способом приложения.

GUI login flow не является обязательным шагом для XE run; отдельные сценарии могут проверять magic-link flow специально.

## Где храним спецификации
В меморибанке:
- `spec/ui/screen-registry.md` — registry экранов и их `screen_id`;
- `spec/ui/screens/` — каталог экранов;
- `spec/ui/test-id-registry.md` — naming contract для `data-testid`;
- `spec/ui/pom/` — каталог POM mapping и automation conventions.

В коде:
- Playwright POM-реализации и helper-объекты живут рядом с web automation layer.

## Обязательные правила
- ключевые интерактивные элементы и assertion targets получают стабильные `data-testid`;
- `data-testid` выводится из `testIdScope`, привязанного к `screen_id`, а не придумывается локально каждым экраном;
- каждый governed route-level screen обязан рендерить root selector вида `<testIdScope>-root` на top-level screen container или на screen-level layout root;
- root selector считается runtime contract между screen registry, route page, POM и e2e/XE tooling;
- screen spec не дублирует POM-код, а описывает смысл и contract экрана;
- POM mapping не дублирует доменные правила, а ссылается на screen spec и UI spec;
- XE phases обращаются к GUI через POM/runtime API, а не через случайные CSS selectors.

## Root selector derivation
- canonical formula: `rootTestId = \`${testIdScope}-root\``;
- route-level page обязана либо сама рендерить этот selector, либо передавать его в screen-level layout/component, который становится runtime root;
- POM, screen docs и audits должны ссылаться именно на derived root selector, а не придумывать отдельные root aliases.

## Implementation entrypoints
- `apps/web/playwright/tests/`
- `apps/web/src/app/`
- `apps/web/src/features/app-shell/components/internal-app-shell.tsx`
- `apps/web/src/features/results/components/results-shared.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0212-testid-normalization.spec.ts`
- `apps/web/playwright/tests/ft-0215-content-first-surfaces.spec.ts`
- `packages/xe-runner/src/ft-0205-scenarios.test.ts`
