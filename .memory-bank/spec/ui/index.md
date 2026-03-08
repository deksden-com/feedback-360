# UI Index
Status: Draft (2026-03-03)

- [Sitemap & flows](sitemap-and-flows.md) — список экранов и переходов. Читать, чтобы UI покрывал “сквозные” сценарии и оставался тонким.
- [UI redesign handoff](redesign-screen-catalog.md) — единый документ для редизайна: экраны, переходы, структура информации, действия и доменные ограничения. Читать, когда нужно передать продукт в специализированный UI/UX инструмент без потери поведения системы.
- [UI design principles](design-principles.md) — общие принципы content-first UI, familiar SaaS shell и common CRUD/dashboard patterns. Читать перед UI refactor, чтобы улучшения были системными, а не точечными.
- [Design system](design-system/index.md) — tokens, semantic colors, component patterns и sync policy для visual language приложения. Читать перед UI polish и theme work, чтобы экранные улучшения собирались в систему, а не в локальные patch-и.
- [Screen-by-screen redesign](screen-by-screen-redesign.md) — рекомендации по каждому текущему маршруту: что оставить, что перестроить и в каком порядке. Читать, чтобы планировать UI polish и redesign поэтапно.
- [Screen registry](screen-registry.md) — канонический список `screen_id`, routes и `testIdScope` для всех экранов. Читать, чтобы screen specs, guides, screenshots и код ссылались на один и тот же идентификатор экрана.
- [Test ID registry](test-id-registry.md) — naming contract для `data-testid`, построенный от `screen_id`/`testIdScope`. Читать, чтобы UI automation и код экранов использовали единый паттерн селекторов.
- [Screen specs](screens/index.md) — нормативные документы по отдельным экранам: purpose, sections, actions, states, permissions. Читать, чтобы GUI сценарии, POM и UI refactor опирались на один contract.
- [POM mapping](pom/index.md) — automation-level mapping экранов на page objects и stable test ids. Читать, чтобы XE/browser automation были надёжными и не дублировали screen specs.
- [Design references (stitch)](design-references-stitch.md) — каталог референс-экранов из `stitch_go360go/` с маппингом по реализованному EP-008 и запланированным GUI-эпикам EP-011..EP-019. Читать, чтобы использовать макеты последовательно и не нарушить доменные инварианты.
- [UI assets index](../../assets/ui/index.md) — где хранятся реальные screenshot/html assets и как они разложены по source set. Читать, чтобы планы и implementation notes ссылались на стабильные пути в репозитории.
