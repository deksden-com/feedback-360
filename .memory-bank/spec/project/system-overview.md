# System overview
Status: Draft (2026-03-03)

**feedback-360** — внутренняя корпоративная система для HR-оценки сотрудников методом 360 градусов.

Зафиксированные факты:
- Назначение: поддержать HR в проведении 360 по лучшим практикам отрасли.
- Multi-tenant: несколько компаний в одной инсталляции; `company_id` почти везде.
- Роли доступа: HR admin, HR reader, руководитель, сотрудник.
- Вход: MVP — magic link (email). Telegram magic link / OAuth — позже. Telegram login — в самый конец.
- Уведомления: MVP — email-only. Telegram позже, но закладываем `telegram_user_id/chat_id`.
- Web UI stack: Next.js App Router + Tailwind CSS v4 + shadcn/ui.
- AI: внешний сервис постобработки текстов; запуск по `campaign_id`; webhook обратно (HMAC + ai_job_id + идемпотентность + ретраи).
- Employee (HR) и User (Auth) — разные сущности; user соответствует email и может состоять в нескольких компаниях.
