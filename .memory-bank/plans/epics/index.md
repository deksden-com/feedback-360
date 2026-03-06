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
- [EP-009 Test & release hardening](EP-009-test-release-hardening/index.md): стабилизация DB integration tests, CI checks topology, beta smoke gates и sync evidence. Читать, чтобы поставка фич стала предсказуемой и без flaky merge blockers.
- [EP-010 Production readiness](EP-010-prod-readiness/index.md): retention/privacy, observability, runbook drill и release rehearsal. Читать, чтобы после MVP система была готова к спокойной эксплуатации.

Эпики (next GUI wave):
- [EP-011 App shell and navigation](EP-011-app-shell-navigation/index.md): единый shell, navigation и role-aware home dashboards. Читать, чтобы будущие UI slices строились на общем каркасе.
- [EP-012 HR campaigns UX](EP-012-hr-campaigns-ux/index.md): HR list/create/detail flows для кампаний. Читать, чтобы главный HR surface стал цельным.
- [EP-013 Questionnaire experience](EP-013-questionnaire-experience/index.md): inbox, structured fill flow и read-only states. Читать, чтобы анкеты стали удобным end-user опытом.
- [EP-014 Results experience](EP-014-results-experience/index.md): employee/manager/HR results dashboards. Читать, чтобы reporting UI был role-aware и privacy-safe.
- [EP-015 People and org admin](EP-015-people-org-admin/index.md): employees directory/profile и org editor. Читать, чтобы справочник и оргструктура поддерживались через GUI.
- [EP-016 Competency models and matrix UI](EP-016-models-matrix-ui/index.md): модели компетенций и matrix builder. Читать, чтобы содержание оценки и assignments были управляемы в web UI.
- [EP-017 Notification center UI](EP-017-notification-center-ui/index.md): reminders/templates/delivery diagnostics. Читать, чтобы notifications subsystem стал видимым и управляемым.
- [EP-018 Admin and ops UI](EP-018-admin-ops-ui/index.md): environment health, AI/webhook diagnostics и audit console. Читать, чтобы эксплуатация системы меньше зависела от внешних панелей и CLI.
