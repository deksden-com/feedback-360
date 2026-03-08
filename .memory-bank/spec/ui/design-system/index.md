# Design system — index
Status: Draft (2026-03-07)

Этот раздел хранит **SSoT по визуальному языку приложения**: токены, semantic colors, surface hierarchy и правила использования reusable UI patterns.

Он нужен, чтобы:
- UI polish не превращался в набор разрозненных “красивостей”;
- screen-level refactor шёл через единый visual contract;
- guides/screenshots/design refs можно было синхронизировать с кодом и screen specs.

Связанные документы:
- [UI design principles](../design-principles.md) — общие product-level правила content-first UI и familiar SaaS patterns. Читать первым, чтобы design system не отрывалась от UX-целей.
- [Screen registry](../screen-registry.md) — канонические `screen_id` и `testIdScope`. Читать, чтобы визуальные изменения были привязаны к конкретным surfaces.
- [Screen-by-screen redesign](../screen-by-screen-redesign.md) — по каким маршрутам применяем system-level правила. Читать, чтобы токены и patterns сразу маппились на реальные страницы.

- [Theme tokens](tokens.md) — цветовые, surface, typography и spacing tokens для `apps/web`. Читать, чтобы UI refactor использовал единый набор примитивов вместо ad-hoc классов.
- [Visual baseline v2](visual-baseline-v2.md) — reference-driven visual baseline на основе refined `login` / `dashboard` / `questionnaire`. Читать, когда нужно привести остальные screens в ту же stylistic family.
- [Semantic status colors](status-semantics.md) — mapping статусов кампаний/AI/soft-delete на semantic colors и badges. Читать, чтобы статусы были узнаваемыми и единообразными.
- [Component usage rules](component-usage.md) — как использовать cards, badges, tables, toolbars, headers и other recurring patterns. Читать, чтобы CRUD/dashboard screens выглядели как части одного продукта.
- [Sync policy](sync-policy.md) — как design system синхронизируется с screen specs, guides, screenshots и feature plans. Читать перед UI refactor, чтобы визуальные изменения не расходились с docs/evidence.
