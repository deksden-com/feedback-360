# Memory Bank — Index

## Quick start (for agents)
- [Project structure](structure.md): где лежат `apps/`, `packages/`, `.memory-bank/` и как разделены слои. Читать в начале работы, чтобы сразу класть изменения в правильные места.
- [System overview](spec/project/system-overview.md): краткая картина продукта, акторов и ключевых ограничений MVP. Читать для быстрого доменного контекста перед реализацией.
- [Glossary](spec/glossary.md): каноничные определения терминов (campaign, assignment, anonymity, NA/UNSURE и т.д.). Читать, чтобы не путать смыслы в коде/тестах/доках.
- [Coding style](spec/engineering/coding-style.md): правила кодирования (TS/Node/Next), формат ошибок, соглашения по CLI output. Читать перед началом разработки, чтобы изменения были единообразны.
- [Architecture guardrails](spec/engineering/architecture-guardrails.md): границы core/client/web и правила слоёв+vertical slices. Читать перед кодом, чтобы не утащить бизнес-логику в UI/CLI.
- [Implementation playbook](plans/implementation-playbook.md): пошаговый чеклист реализации фичи (contract→core→db→cli→tests→docs). Читать как рабочую инструкцию полного цикла разработки.
- [Testing standards](spec/engineering/testing-standards.md): уровни тестов и правила acceptance/GS покрытий. Читать перед проверкой фичи, чтобы запускать правильные тесты.
- [Verification matrix](plans/verification-matrix.md): обязательные проверки по FT/GS и формат evidence. Читать перед закрытием фичи, чтобы фиксировать подтверждение готовности.
- [Delivery standards](spec/engineering/delivery-standards.md): единый процесс закрытия фич (traceability, acceptance gate, evidence). Читать перед merge, чтобы `Completed` был подтверждён проверками.
- [Git flow](spec/operations/git-flow.md): ветки, naming, commit/PR traceability (`[FT-*]/[EP-*]`) и обязательные проверки/evidence. Читать до создания ветки и PR, чтобы вести работу по стандарту.
- [Deployment architecture](spec/operations/deployment-architecture.md): карта beta/prod окружений и обязательные env vars/интеграции. Читать перед deploy, чтобы не смешивать конфигурации окружений.
- [Runbook](spec/operations/runbook.md): релизный и операционный чеклист (env/migrations/smoke/incident). Читать перед выкладкой, чтобы пройти деплой без пропусков.

## Key folders (SSoT map)
- [Specifications (`spec/`)](spec/index.md): все нормативные требования (WHAT) по домену, безопасности, тестам, ops и интерфейсам. Читать как главный источник правил поведения системы.
- [Plans (`plans/`)](plans/index.md): roadmap, эпики/фичи, implementation playbook и verification matrix. Читать, чтобы понимать порядок работ и критерии приёмки.
- [ADR (`adr/`)](adr/index.md): решения уровня “почему” и ключевые компромиссы. Читать перед изменением архитектурных подходов.
- [Memory Bank Bible (`mbb/`)](mbb/index.md): правила ведения документации (SSoT, аннотированные ссылки, индексы, шаблоны). Читать при любом изменении меморибанка.

## Specifications — important docs
- [C4 package (`spec/c4/`)](spec/c4/index.md): L1/L2/L3 описание системы и её контейнеров/компонентов. Читать, чтобы сохранять архитектурную целостность при росте проекта.
- [Project boundaries (`spec/project/`)](spec/project/index.md): стек, MVP scope, non-goals, слои и target-структура репо. Читать, чтобы не выходить за границы MVP и не ломать структуру.
- [Domain rules (`spec/domain/`)](spec/domain/index.md): state machines, матрица оценщиков, анкеты, расчёты, анонимность, видимость результатов. Читать как основу для core use-cases и инвариантов.
- [Security rules (`spec/security/`)](spec/security/index.md): identity/auth, RBAC, RLS, webhook security. Читать перед реализацией доступа и интеграций.
- [Client API (`spec/client-api/`)](spec/client-api/index.md): операции, ошибки и transport contract для thin clients. Читать, чтобы CLI/UI работали через один typed-контракт.
- [Testing package (`spec/testing/`)](spec/testing/index.md): seed-сценарии, golden scenarios, traceability и test strategy. Читать, чтобы строить проверяемые и воспроизводимые тесты.
- [Operations package (`spec/operations/`)](spec/operations/index.md): git flow, deployment architecture, runbook, DNS, privacy/retention. Читать перед релизом и настройкой окружений.
- [CLI spec (`spec/cli/`)](spec/cli/index.md): каталог команд, human/`--json` форматы, контракт CLI-first процесса. Читать для расширения и стабилизации автоматизируемых сценариев.
- [UI spec (`spec/ui/`)](spec/ui/index.md): sitemap/flows и минимальные wireframes без логики в клиенте. Читать для согласованной эволюции интерфейса.
- [Notifications (`spec/notifications/`)](spec/notifications/index.md): события, outbox/idempotency, RU-шаблоны и расписания. Читать, чтобы уведомления были устойчивыми и не дублировались.
- [AI processing (`spec/ai/`)](spec/ai/index.md): запуск AI job, статусы и связь с webhook. Читать, чтобы безопасно реализовывать пост-обработку комментариев.

## Plans — important docs
- [Roadmap](plans/roadmap.md): порядок эпиков и логика последовательности поставки. Читать, чтобы не терять фокус в реализации.
- [Epic catalog](plans/epics.md): полный список EP/FT и их целевая структура. Читать для навигации по текущему объёму работ.
- [Epic plans (`plans/epics/`)](plans/epics/index.md): детальные страницы эпиков и фич с deliverables/acceptance. Читать перед стартом конкретной фичи.
- [Implementation playbook](plans/implementation-playbook.md): практический чеклист “FT → код → тесты → docs”. Читать как рабочую инструкцию для реализации vertical slice.
- [Verification matrix](plans/verification-matrix.md): обязательные тесты/сценарии и execution evidence по эпикам. Читать как финальный критерий готовности фич.

## ADR — important docs
- [ADR 0001](adr/0001-core-client-cli-first.md): почему выбрана модель core + typed client + CLI-first перед UI. Читать для сохранения архитектурной дисциплины.
- [ADR 0002](adr/0002-anonymity-threshold.md): как применяется порог анонимности и почему именно так. Читать перед изменениями в расчётах/видимости результатов.
- [ADR 0003](adr/0003-freeze-on-draft-save.md): почему lock наступает на первом draft-save и каковы последствия. Читать при изменениях freeze-логики кампании.

## MBB — writing rules
- [Principles](mbb/principles.md): базовые правила SSoT, traceability и evidence-first completion. Читать перед правками документации, чтобы не расползались стандарты.
- [Templates](mbb/templates/index.md): каноничные шаблоны для epic/feature документов. Читать при создании новых планов, чтобы структура была единообразной.
- [Indexing](mbb/indexing.md): правила построения `index.md` (в т.ч. progressive disclosure). Читать при обновлении навигации и индексов папок.
