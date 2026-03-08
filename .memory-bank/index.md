# Memory Bank — Index

## Quick start (for agents)
- [Project structure](structure.md): где лежат `apps/`, `packages/`, `.memory-bank/` и как разделены слои. Читать в начале работы, чтобы сразу класть изменения в правильные места.
- [System overview](spec/project/system-overview.md): краткая картина продукта, акторов и ключевых ограничений MVP. Читать для быстрого доменного контекста перед реализацией.
- [Glossary](spec/glossary.md): каноничные определения терминов (campaign, assignment, anonymity, NA/UNSURE и т.д.). Читать, чтобы не путать смыслы в коде/тестах/доках.
- [Coding style](spec/engineering/coding-style.md): правила кодирования (TS/Node/Next), формат ошибок, соглашения по CLI output. Читать перед началом разработки, чтобы изменения были единообразны.
- [Frontend UI stack](spec/engineering/frontend-ui-stack.md): зафиксированный baseline `Tailwind v4 + shadcn/ui` для `apps/web` и политика обновления. Читать перед UI-фичами, чтобы не смешивать разные подходы к стилям/компонентам.
- [UI design system](spec/ui/design-system/index.md): tokens, semantic statuses, component rules и sync policy для visual language. Читать перед UI polish/refactor, чтобы изменения экранов собирались в систему, а не в разрозненные patch-и.
- [Visual references policy](mbb/visual-references.md): как хранить и использовать mockups/screenshots без подмены требований и архитектуры. Читать перед планированием GUI-фич, чтобы visual refs помогали, а не вносили шум.
- [Architecture guardrails](spec/engineering/architecture-guardrails.md): границы core/client/web и правила слоёв+vertical slices. Читать перед кодом, чтобы не утащить бизнес-логику в UI/CLI.
- [Feature-area boundaries](spec/project/feature-area-boundaries.md): ownership boundaries между `campaigns/results/questionnaires/...`, правила для `shared` и root composition points. Читать перед structural refactor и новыми slices, чтобы понимать не только layout, но и почему границы проведены именно так.
- [Implementation playbook](plans/implementation-playbook.md): пошаговый чеклист реализации фичи (contract→core→db→cli→tests→docs). Читать как рабочую инструкцию полного цикла разработки.
- [Testing standards](spec/engineering/testing-standards.md): уровни тестов и правило двух гейтов (quality checks + acceptance/GS). Читать перед проверкой фичи, чтобы запускать проверки в правильной последовательности.
- [Verification matrix](plans/verification-matrix.md): обязательные проверки по FT/GS и формат evidence. Читать перед закрытием фичи, чтобы фиксировать подтверждение готовности по каждому сценарию.
- [XE scenarios](plans/xe/index.md): cross-epic сценарии, их фазы и expected artifacts. Читать перед проектированием или запуском сквозных продуктовых прогонов.
- [Delivery standards](spec/engineering/delivery-standards.md): единый процесс закрытия фич (traceability, quality gate, acceptance gate, evidence). Читать перед merge, чтобы `Completed` был подтверждён всеми обязательными проверками.
- [Git flow](spec/operations/git-flow.md): ветки, naming, commit/PR traceability (`[FT-*]/[EP-*]`) и обязательные проверки/evidence. Читать до создания ветки и PR, чтобы вести работу по стандарту.
- [Deployment architecture](spec/operations/deployment-architecture.md): карта beta/prod окружений и обязательные env vars/интеграции. Читать перед deploy, чтобы не смешивать конфигурации окружений.
- [Runbook](spec/operations/runbook.md): релизный и операционный чеклист (env/migrations/smoke/incident). Читать перед выкладкой, чтобы пройти деплой без пропусков.

## Key folders (SSoT map)
- [Specifications (`spec/`)](spec/index.md): все нормативные требования (WHAT) по домену, безопасности, тестам, ops и интерфейсам. Читать как главный источник правил поведения системы.
- [Guides (`guides/`)](guides/index.md): потребительская документация в стиле Diátaxis — tutorials/how-to/explanation/reference. Читать, когда нужно объяснить, как пользоваться системой, не смешивая это с нормативным SSoT.
- [Plans (`plans/`)](plans/index.md): roadmap, эпики/фичи, implementation playbook и verification matrix. Читать, чтобы понимать порядок работ и критерии приёмки.
- [ADR (`adr/`)](adr/index.md): решения уровня “почему” и ключевые компромиссы. Читать перед изменением архитектурных подходов.
- [Memory Bank Bible (`mbb/`)](mbb/index.md): правила ведения документации (SSoT, аннотированные ссылки, индексы, шаблоны). Читать при любом изменении меморибанка.
- [Assets (`assets/`)](assets/index.md): не-нормативные артефакты проекта, включая visual references и вспомогательные материалы. Читать, чтобы понимать происхождение UI референсов и не путать их с SSoT.

## Specifications — important docs
- [C4 package (`spec/c4/`)](spec/c4/index.md): L1/L2/L3 описание системы и её контейнеров/компонентов. Читать, чтобы сохранять архитектурную целостность при росте проекта.
- [Project boundaries (`spec/project/`)](spec/project/index.md): стек, MVP scope, non-goals, слои и target-структура репо. Читать, чтобы не выходить за границы MVP и не ломать структуру.
- [Feature-area boundaries (`spec/project/feature-area-boundaries.md`)](spec/project/feature-area-boundaries.md): canonical feature areas, ownership rules и ограничение `shared`. Читать перед code organization changes, чтобы структура проекта была осмысленной и воспроизводимой.
- [Domain rules (`spec/domain/`)](spec/domain/index.md): state machines, матрица оценщиков, анкеты, расчёты, анонимность, видимость результатов. Читать как основу для core use-cases и инвариантов.
- [Security rules (`spec/security/`)](spec/security/index.md): identity/auth, RBAC, RLS, webhook security. Читать перед реализацией доступа и интеграций.
- [Client API (`spec/client-api/`)](spec/client-api/index.md): операции, ошибки и transport contract для thin clients. Читать, чтобы CLI/UI работали через один typed-контракт.
- [Testing package (`spec/testing/`)](spec/testing/index.md): seed-сценарии, golden scenarios, traceability и test strategy. Читать, чтобы строить проверяемые и воспроизводимые тесты.
- [XE contracts (`spec/testing/xe-*.md`)](spec/testing/index.md): XE run model, CLI contract, JSON schemas и runner structure. Читать, чтобы строить cross-epic сценарии на одном согласованном основании.
- [Operations package (`spec/operations/`)](spec/operations/index.md): git flow, deployment architecture, runbook, DNS, privacy/retention. Читать перед релизом и настройкой окружений.
- [Guides package (`guides/`)](guides/index.md): пользовательские how-to/tutorial/explanation/reference документы поверх продукта и сценариев. Читать, когда нужен понятный product walkthrough без перегруза внутренними спецификациями.
- [CLI spec (`spec/cli/`)](spec/cli/index.md): каталог команд, human/`--json` форматы, контракт CLI-first процесса. Читать для расширения и стабилизации автоматизируемых сценариев.
- [UI spec (`spec/ui/`)](spec/ui/index.md): sitemap/flows и минимальные wireframes без логики в клиенте. Читать для согласованной эволюции интерфейса.
- [UI redesign handoff](spec/ui/redesign-screen-catalog.md): единый экранный handoff для внешнего редизайна — переходы, информационные блоки, действия и доменные ограничения. Читать, когда нужно отдавать интерфейс в специализированный инструмент/дизайнеру без потери продуктовых инвариантов.
- [UI redesign principles](spec/ui/design-principles.md): как делать интерфейс content-first и ближе к familiar SaaS patterns, не ломая доменную логику. Читать перед редизайном, чтобы улучшать hierarchy и UX системно.
- [Design system v2 baseline](spec/ui/design-system/visual-baseline-v2.md): новый visual baseline на основе refined auth/dashboard/questionnaire references. Читать, если продолжаем раскатывать единый стиль по продукту.
- [UI redesign audit](spec/ui/screen-by-screen-redesign.md): экран-за-экраном список улучшений текущих маршрутов. Читать перед UI planning, чтобы понимать, какие surfaces давать в работу первыми.
- [Screen registry](spec/ui/screen-registry.md): канонический реестр `screen_id` и `testIdScope` для экранов. Читать перед правками UI/docs/evidence, чтобы все говорили об одном и том же surface.
- [Test ID registry](spec/ui/test-id-registry.md): единый паттерн именования `data-testid` от screen scope. Читать перед UI automation и рефакторингом экранов, чтобы селекторы не расползались.
- [UI screen specs (`spec/ui/screens/`)](spec/ui/screens/index.md): отдельные экранные контракты для UI и XE automation. Читать, чтобы не смешивать sitemap с подробным поведением конкретных экранов.
- [UI POM mapping (`spec/ui/pom/`)](spec/ui/pom/index.md): правила page objects, `data-testid` и browser automation. Читать, чтобы GUI-тесты и XE-фазы опирались на стабильные контракты.
- [UI assets (`assets/ui/`)](assets/ui/index.md): реальные stitch screenshot/html assets и их provenance. Читать, чтобы быстро открыть visual reference из плана или UI spec.
- [Notifications (`spec/notifications/`)](spec/notifications/index.md): события, outbox/idempotency, RU-шаблоны и расписания. Читать, чтобы уведомления были устойчивыми и не дублировались.
- [AI processing (`spec/ai/`)](spec/ai/index.md): запуск AI job, статусы и связь с webhook. Читать, чтобы безопасно реализовывать пост-обработку комментариев.

## Plans — important docs
- [Roadmap](plans/roadmap.md): порядок эпиков и логика последовательности поставки. Читать, чтобы не терять фокус в реализации.
- [Epic catalog](plans/epics.md): полный список EP/FT и их целевая структура. Читать для навигации по текущему объёму работ.
- [Epic plans (`plans/epics/`)](plans/epics/index.md): детальные страницы эпиков и фич с deliverables/acceptance. Читать перед стартом конкретной фичи.
- [GUI wave — EP-011..EP-019](plans/epics/EP-011-app-shell-navigation/index.md): следующая серия GUI-эпиков после MVP/prod readiness, включая post-EP-013 structural refactor EP-014. Читать, чтобы видеть план эволюции интерфейса и supporting codebase от shell до ops UI.
- [UI traceability and SaaS polish — EP-021](plans/epics/EP-021-ui-traceability-saas-polish/index.md): следующий слой UI после XE foundation — screen ids, predictable test ids и content-first polish для ключевых surfaces. Читать перед UI refactor, чтобы продуктовый facelift не потерял проверяемость.
- [Unified visual system rollout — EP-022](plans/epics/EP-022-visual-system-rollout/index.md): следующая визуальная волна после EP-021 — единый стиль для auth, shell, CRUD, questionnaire и results. Читать, если продолжаем продуктовый редизайн по новому baseline.
- [Implementation playbook](plans/implementation-playbook.md): практический чеклист “FT → код → тесты → docs”. Читать как рабочую инструкцию для реализации vertical slice.
- [Verification matrix](plans/verification-matrix.md): обязательные тесты/сценарии и execution evidence по эпикам. Читать как финальный критерий готовности фич.
- [XE scenario catalog](plans/xe/index.md): first-class cross-epic runs, начиная с `XE-001`. Читать, чтобы строить сквозные проверки поверх уже существующих feature/golden tests.

## ADR — important docs
- [ADR 0001](adr/0001-core-client-cli-first.md): почему выбрана модель core + typed client + CLI-first перед UI. Читать для сохранения архитектурной дисциплины.
- [ADR 0002](adr/0002-anonymity-threshold.md): как применяется порог анонимности и почему именно так. Читать перед изменениями в расчётах/видимости результатов.
- [ADR 0003](adr/0003-freeze-on-draft-save.md): почему lock наступает на первом draft-save и каковы последствия. Читать при изменениях freeze-логики кампании.
- [ADR 0004](adr/0004-feature-area-slicing-boundaries.md): почему выбраны feature areas и почему `shared` не должен становиться “свалкой”. Читать перед architectural refactor и перед следующими GUI-эпиками.

## MBB — writing rules
- [Principles](mbb/principles.md): базовые правила SSoT, traceability и evidence-first completion. Читать перед правками документации, чтобы не расползались стандарты.
- [Templates](mbb/templates/index.md): каноничные шаблоны для epic/feature документов. Читать при создании новых планов, чтобы структура была единообразной.
- [Indexing](mbb/indexing.md): правила построения `index.md` (в т.ч. progressive disclosure). Читать при обновлении навигации и индексов папок.
- [Visual references](mbb/visual-references.md): правила работы с mockups, screenshots и design bundles. Читать, чтобы новый visual source не ломал структуру меморибанка.
