# Deployment / Runbook (draft)
Status: Draft (2026-03-03)

Окружение:
- Next.js на Vercel
- Supabase (cloud)
- Resend
- Cron (Vercel cron)

Ключевые cron jobs (MVP):
- End campaigns by `end_at`
- Generate reminders (outbox enqueue)
- Dispatch outbox
- Retry failed outbox/ai jobs (bounded)

