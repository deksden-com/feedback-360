# Design system sync policy
Status: Draft (2026-03-07)

Цель: описать, как дизайн-система синхронизируется с кодом, screen specs, guides и evidence, чтобы visual refactor не расползался.

## SSoT split
- `spec/ui/design-system/*` — visual contract и reusable UI rules.
- `spec/ui/screens/*` — contract конкретных экранов.
- `spec/ui/screen-registry.md` — registry экранов и scopes.
- `guides/*` — пользовательские walkthrough, которые используют screen ids и screenshots.
- код — actual implementation поверх tokens/components.

## Mandatory sync points
Когда меняем screen-level UI materially:
1. проверить `screen_id` в registry;
2. проверить/обновить screen spec;
3. если изменился reusable pattern или visual token — обновить design-system docs;
4. если screen screenshots в guides/evidence устарели — переснять и обновить;
5. если changed selectors/POM contract — обновить POM/test-id docs and tests.

## Which feature docs must link design system
Любая UI feature, которая:
- меняет shell;
- меняет page hierarchy;
- вводит новые repeated UI patterns;
- меняет semantic statuses or badges;
- materially changes screenshots/tutorials,

обязана в `Context (SSoT links)` ссылаться на:
- `spec/ui/design-system/index.md`
- relevant token/component/status docs

## Quality gate addition for UI features
Для UI polish/refactor FT:
- code checks;
- Playwright/local acceptance;
- beta manual verification;
- docs audit;
- screenshot/evidence refresh where screen materially changed.
