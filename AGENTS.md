# feedback-360 — AGENTS.md
Status: Draft (2026-03-03)

## System summary (C4 L1)
`feedback-360` — внутренняя корпоративная система для HR-оценки сотрудников методом **360 градусов** с best practices: **анонимность**, **группы оценщиков**, **веса**, **заморозка условий**, **read-only после дедлайна**, **auditability**.

Акторы: HR Admin, HR Reader, Manager, Employee.

Внешние системы: Supabase (Postgres+Auth), Resend (email), Vercel (hosting+cron), AI Processing Service (external), Telegram (позже).

## Key facts & constraints (from TЗ)
- Stack: TS/Node, Next.js App Router, Tailwind CSS v4 + shadcn/ui (web UI), Supabase (cloud), Drizzle, Vercel.
- Tooling: Biome, Vitest, Playwright, pnpm workspace.
- Email: Resend (transactional).
- CLI: Commander; human-readable + `--json` (AI-friendly), с примерами и расширенной справкой.
- Telegram: в MVP email-only; под Telegram закладываем поля/таблицы (`telegram_user_id/chat_id`).
- Auth: MVP — magic link email. Public signups off; доступ только если email есть в HR-справочнике. Telegram login/OAuth — позже.
- Identity: `User` (Supabase Auth) ≠ `Employee` (HR). `User` соответствует email и может состоять в нескольких компаниях; HR Admin создаёт аккаунты заранее.
- Multi-tenant: `company_id` почти везде; роли через memberships.
- Кампания: статусы `draft -> started -> ended -> processing_ai -> (ai_failed|completed)`.
- Freeze: первый `draft save` в любой анкете фиксирует `campaign.locked_at` (после этого нельзя менять матрицу/веса).
- Анонимность: threshold=3; оценка руководителя всегда не анонимна; self вес 0%.
- AI: запуск по `campaign_id`; webhook обратно; безопасность webhook: HMAC + `ai_job_id` + идемпотентность + ретраи.

## Architecture rules (layers + vertical slices)
- Значимая бизнес-логика живёт в core use-cases/policies; UI/CLI — “тонкие” клиенты.
- Каждая фича делается вертикальным слайсом: contract → core → db → cli → tests → docs (см. меморибанк).

## Memory bank (SSoT)
Меморибанк находится в `.memory-bank/` и является SSoT по требованиям/решениям/планам.

Ссылки (аннотированные):
- [`.memory-bank/index.md`](.memory-bank/index.md) — главный индекс меморибанка (куда идти за spec/plans/adr/mbb). Читать, чтобы быстро найти SSoT по теме и не создавать orphan документы.
- [`.memory-bank/mbb/index.md`](.memory-bank/mbb/index.md) — “библия” меморибанка: правила SSOT/аннотированных ссылок/duo pattern/индексов. Читать перед созданием новых документов, чтобы соблюдать стандарты и не плодить дубли.
- [`.memory-bank/structure.md`](.memory-bank/structure.md) — структура репозитория по папкам (apps/packages) и границы слоёв. Читать, чтобы правильно раскладывать код и не тащить бизнес-логику в UI/CLI.
- [`.memory-bank/spec/index.md`](.memory-bank/spec/index.md) — спецификации (WHAT). Читать, чтобы реализовывать правила домена и интеграции корректно.
- [`.memory-bank/adr/index.md`](.memory-bank/adr/index.md) — ADR (WHY). Читать, чтобы не отменять решения случайно и понимать компромиссы.
- [`.memory-bank/plans/index.md`](.memory-bank/plans/index.md) — планы эпиков/фич + сценарии. Читать, чтобы делать работу вертикальными слайсами с автопроверками.
