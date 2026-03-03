# Epic plans — index
Status: Draft (2026-03-03)

Цель: детальные планы по эпикам/фичам как вертикальным слайсам: что делаем, какие deliverables, какие сценарии/тесты и какие seeds нужны.

Ссылки (аннотированные):
- [How we plan](../how-we-plan.md): DoD фич и формат сценариев. Читать, чтобы каждая фича была проверяемой.
- [Implementation playbook](../implementation-playbook.md): стандартный чеклист “FT → код” и правила обновления меморибанка. Читать, чтобы планы действительно исполнялись, а не оставались декларацией.
- [Seed catalog](../../spec/testing/seeds/index.md): структура seed данных и handles. Читать, чтобы сценарии были детерминированными.
- [Scenario catalog](../../spec/testing/scenarios/index.md): golden сценарии. Читать, чтобы эпики закрывались тестами, а не “на словах”.
- [Engineering standards](../../spec/engineering/index.md): стандарты кодирования/документации/тестов. Читать, чтобы реализация не расходилась по стилю и слоям.

Эпики (MVP order):
- [EP-000 Foundation](EP-000-foundation/index.md): монорепо/инфраструктура разработки, БД, миграции, seed runner и CI базис. Читать, чтобы проект вообще был воспроизводимым.
- [EP-001 Core + Contract + Client + CLI-first](EP-001-core-contract-client-cli/index.md): доменная логика + typed contract + typed client + CLI команды/форматы. Читать, чтобы вертикальные слайсы можно было реализовывать без UI.
- [EP-002 Identity, tenancy, RBAC](EP-002-identity-tenancy-rbac/index.md): users/employees/memberships, signups off, базовые access rules. Читать, чтобы не открыть доступ “не тем”.
- [EP-003 Org structure + snapshots](EP-003-org-snapshots/index.md): departments, manager relations, snapshot на start. Читать, чтобы матрица и история были консистентны.
- [EP-004 Models + campaigns + questionnaires](EP-004-campaigns-questionnaires/index.md): models, кампании, матрица, анкеты, lock semantics. Читать, чтобы появился “сквозной” MVP-поток без UI.
- [EP-005 Results + anonymity + weights](EP-005-results-anonymity/index.md): расчёты, анонимность, показы, edge cases. Читать, чтобы отчёты соответствовали best practices.
- [EP-006 Notifications outbox (email)](EP-006-notifications-outbox/index.md): outbox, расписания, timezone, Resend. Читать, чтобы напоминания работали без дублей.
- [EP-007 AI processing + webhook security](EP-007-ai-webhooks/index.md): ai_jobs, HMAC webhook, processed text aggregates, retry. Читать, чтобы AI обработка была безопасной.
- [EP-008 Minimal UI (thin)](EP-008-ui-minimal/index.md): первые экраны поверх typed client. Читать, чтобы UI не “утёк” в бизнес-логику.
