# Deployment architecture
Status: Draft (2026-03-04)

## Purpose
Зафиксировать архитектуру окружений и связей с внешними сервисами как SSoT для эксплуатации.

## Environments map
- `beta`:
  - Git branch: `develop`
  - Vercel project: `go360go-beta`
  - Domain: `beta.go360go.ru`
  - Supabase project: `go360go-beta` (`fwgmltdbnbuugwskhoie`)
  - Resend: `RESEND_BETA_API_KEY`
  - Sentry DSN: `SENTRY_BETA_DSN`
- `prod`:
  - Git branch: `main`
  - Vercel project: `go360go-prod`
  - Domain: `go360go.ru`
  - Supabase project: `go360go-prod` (`prdtttvmoongmwitnuan`)
  - Resend: `RESEND_PROD_API_KEY`
  - Sentry DSN: `SENTRY_PROD_DSN`

## Deploy topology (L2 ops view)
- `apps/web` deploys on Vercel (App Router).
- Vercel build strategy for monorepo is pinned in `apps/web/vercel.json` (`builds: [{ src: "package.json", use: "@vercel/next" }]`), чтобы избежать empty-output deploy при авто-детекте в `rootDirectory=apps/web`.
- Runtime data in Supabase Postgres + Supabase Auth.
- Transactional email through Resend (custom SMTP also configured in Supabase Auth).
- Error monitoring through Sentry.
- Cron jobs run via Vercel Cron (planned slices for reminders/end/outbox retries).

## Config ownership
- Vercel is the source of truth for runtime env vars.
- Local `.env` is only for operator convenience and bootstrap.
- No secrets in memory bank documents.

## Mandatory env vars (by responsibility)
- App/runtime:
  - `APP_ENV`, `NEXT_PUBLIC_APP_ENV`
- Supabase:
  - `SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_BETA_DB_POOLER_URL` (operator/local convenience)
  - `SUPABASE_PROD_DB_POOLER_URL` (operator/local convenience)
  - `SUPABASE_DB_POOLER_URL` (preferred for cloud scripts/migrations)
  - `DATABASE_URL` (optional fallback for local Postgres)
- Email:
  - `RESEND_API_KEY`
  - `EMAIL_FROM`
- Sentry:
  - `SENTRY_DSN`
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `SENTRY_ENVIRONMENT`
  - `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` (build-time sourcemaps)
- AI webhook security:
  - `AI_WEBHOOK_SECRET` (server-only, shared with AI service signer)

## Auth and DNS dependencies
- Supabase Auth for each project must have:
  - `Site URL` matching environment domain
  - redirect URLs including `/auth/callback` and localhost for dev
  - public signups disabled
  - custom SMTP enabled (Resend)
- DNS/NS and mail records are maintained in:
  - [Domains & DNS](domains-and-dns.md) — exact records and verification checklist. Читать, чтобы не потерять deliverability при изменениях домена.

## Promotion guardrails
- Promote only `develop -> main`, never partial cherry-picks from feature branches into `main`.
- Before promotion: run smoke on beta and ensure monitoring is healthy.
- Keep auth/email/sentry settings symmetric between beta and prod unless explicitly documented.

## DB connection policy
- Для команд DB (`db:migrate`, `db:health`, integration tests) используем `SUPABASE_DB_POOLER_URL` как основной путь к Supabase cloud.
- `DATABASE_URL` оставляем fallback для локального Postgres и dev-окружений.
