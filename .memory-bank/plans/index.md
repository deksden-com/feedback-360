# Plans Index
Status: Draft (2026-03-03)

Этот раздел — **SSoT по плану работ**: эпики, фичи, vertical slices и сценарии приёмки.

- [Roadmap](roadmap.md) — порядок эпиков и rationale. Читать, чтобы понимать “что делаем сначала” и почему.
- [Epics](epics.md) — список эпиков и фич внутри (definition of done кратко). Читать, чтобы дробить работу на вертикальные слайсы.
- [Epic plans](epics/index.md) — детальные планы по эпикам и фичам (vertical slices), с deliverables и сценариями. Читать, чтобы иметь “как именно делаем” и что тестируем.
- [EP-009 Test & release hardening](epics/EP-009-test-release-hardening/index.md) — стабилизация test/release пути после MVP. Читать, чтобы убрать flaky merge blockers и сделать поставку фич предсказуемой.
- [EP-010 Production readiness](epics/EP-010-prod-readiness/index.md) — следующий слой после MVP: observability, retention/privacy, runbook и release rehearsal. Читать, чтобы готовить систему к реальной эксплуатации.
- [EP-011 App shell and navigation](epics/EP-011-app-shell-navigation/index.md) — старт post-MVP GUI wave: общий shell, navigation и role-aware home. Читать, чтобы видеть, как текущий thin UI превратится в цельное приложение.
- [EP-012 HR campaigns UX](epics/EP-012-hr-campaigns-ux/index.md) — следующий HR business surface поверх существующего campaign workbench. Читать, чтобы эволюция HR UI шла от самых частых операций.
- [EP-014 Feature-area slice refactor](epics/EP-014-feature-area-slices-refactor/index.md) — структурный refactor кода и документации сразу после EP-013. Читать, чтобы будущие GUI-эпики строились поверх явных feature areas, а не поверх случайно сложившейся структуры.
- [EP-021 UI traceability and SaaS polish](epics/EP-021-ui-traceability-saas-polish/index.md) — следующий слой после XE: screen ids, normalized test ids и product-feel polish для shell/CRUD/results/questionnaires. Читать, чтобы UI refactor шёл по плану и не терял traceability.
- [EP-022 Unified visual system rollout](epics/EP-022-visual-system-rollout/index.md) — следующая волна редизайна: от design-system v2 к полной визуальной консолидации app surfaces. Читать, если продолжаем обновлять look-and-feel продукта.
- [EP-023 Documentation traceability and SSoT hardening](epics/EP-023-documentation-traceability-hardening/index.md) — системный hardening docs/code/JSDoc связей, screen specs и metadata conventions. Читать, если хотим довести memory-bank и код до по-настоящему рабочего traceability graph.
- [Post-EP-023 hardening backlog](post-ep023-hardening-backlog.md) — короткий backlog следующей quality-wave после EP-023: deeper `@docs`, broader ownership links, stronger consistency audits и richer operator reference. Читать, если выбираем следующий небольшой hardening slice без запуска нового большого эпика.
- [Implementation playbook](implementation-playbook.md) — как превращаем FT-документы в код (contract/core/db/cli/tests) и как обновляем меморибанк по итогу. Читать, чтобы реализация была одинаковой и без “утечки логики” в клиенты.
- [Feature template](feature-template.md) — ссылка на каноничный шаблон фичи (vertical slice) в MBB templates. Читать, чтобы новые фичи описывались единообразно и без дублей.
- [How we plan](how-we-plan.md) — правила планирования и DoD фичи + связь с seed и тестами. Читать, чтобы план был исполнимым и проверяемым.
- [Scenario registry](scenarios.md) — список ключевых сценариев MVP и их связь с seeds/tests. Читать, чтобы план и тесты оставались синхронизированными.
- [Verification matrix](verification-matrix.md) — какой automated test добавляем и какие GS/Acceptance должны быть зелёными для каждой FT. Читать, чтобы “готово” означало проверяемо и воспроизводимо.
- [XE scenarios](xe/index.md) — каталог cross-epic сценариев и их фаз. Читать, чтобы сквозные продуктовые проверки были отдельным first-class контуром, а не набором ad-hoc e2e.
- [Engineering standards](../spec/engineering/index.md) — стандарты кодирования/тестирования/документации. Читать, чтобы фичи делались одинаково и без утечки доменной логики в UI/CLI.
- [Client API](../spec/client-api/index.md) — typed contract/client и каталог операций v1. Читать, чтобы планируемые фичи были “вертикальными” и имели явные операции для UI/CLI/тестов.
- [UI design references](../spec/ui/design-references-stitch.md) — как stitch bundle маппится на будущие GUI-эпики и что из него можно брать. Читать перед UI-планированием, чтобы сценарии и design refs были синхронизированы.
