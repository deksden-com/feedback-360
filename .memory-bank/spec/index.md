# Spec Index — feedback-360
Status: Draft (2026-03-03)

Этот раздел — **SSoT по требованиям** (WHAT). Решения “почему так” живут в `../adr/`.

- [Project](project/index.md) — что это за система, стек, MVP-границы, слои и vertical slices. Читать, чтобы держать фокус и не расползаться.
- [Glossary](glossary.md) — словарь терминов и каноничные определения. Читать, чтобы команда одинаково понимала “кампанию/анкету/назначения/анонимность/NA”.
- [C4](c4/index.md) — L1/L2/L3 описания системы и разбиение на контейнеры/компоненты. Читать, чтобы держать архитектуру без оверинжиниринга и правильно резать vertical slices.
- [Engineering](engineering/index.md) — стандарты кодирования/архитектурных границ/тестов/документации. Читать, чтобы код был однообразным, а фичи закрывались автосценариями.
- [Client API](client-api/index.md) — typed contract + typed client: операции, ошибки, auth context, in-proc vs HTTP. Читать, чтобы UI/CLI оставались тонкими и работали поверх одного контракта.
- [Domain](domain/index.md) — доменная модель, state machines, оргструктура/снапшоты, анкеты, расчёты, анонимность. Читать, чтобы реализовывать core use-cases и тесты.
- [Data](data/index.md) — ERD/список таблиц и ключевые связи. Читать, чтобы проектировать миграции и RLS.
- [Security](security/index.md) — identity/auth, RBAC, RLS стратегия, webhook security. Читать, чтобы не сломать multi-tenant и защиту AI-webhook.
- [Notifications](notifications/index.md) — события, расписания, outbox, шаблоны RU v1. Читать, чтобы письма не дублировались и приходили в правильное время.
- [AI](ai/index.md) — запуск job, статусы, формат результатов и связка с webhook. Читать, чтобы AI-обработка была устойчивой и предсказуемой.
- [CLI](cli/index.md) — CLI контракт и команды (human+json). Читать, чтобы агент/разработчик мог воспроизводить сценарии без UI.
- [UI](ui/index.md) — sitemap/flows и минимальные wireframes (без дизайна). Читать, чтобы UI оставался “тонким” поверх typed client.
- [Testing](testing/index.md) — стратегия тестирования и “golden scenarios”. Читать, чтобы понимать минимальный набор автопроверок на MVP.
- [Operations](operations/index.md) — runbook, env vars, cron jobs, observability, privacy/retention. Читать, чтобы система была эксплуатационно жизнеспособной.
