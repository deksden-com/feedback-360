# Deployment / Runbook
Status: Draft (2026-03-04)

## Purpose
Операционный чеклист для запуска и поддержки beta/prod окружений без потери консистентности.

## References (SSoT)
- [Git flow](git-flow.md) — как продвигаем изменения между ветками и окружениями. Читать перед релизом, чтобы не нарушить процесс промоушена.
- [Deployment architecture](deployment-architecture.md) — где расположены сервисы и какие env vars обязательны. Читать перед настройкой окружения.
- [Domains & DNS](domains-and-dns.md) — текущие DNS записи и проверка deliverability. Читать при любых изменениях домена/почты.

## Release checklist
1. Merge feature PR into `develop`.
2. Verify beta deployment (`beta.go360go.ru`):
   - app health endpoint
   - auth redirect and magic-link flow
   - core smoke scenarios (seed/migrations/tests)
3. Ensure CI is green (`lint`, `typecheck`, `test`).
4. Merge `develop -> main`.
5. Verify production deployment (`go360go.ru`) with smoke checks.

## Environment checklist
- Vercel env vars are present and mapped to the right environment.
- Supabase Auth is configured:
  - public signups OFF
  - site URL and redirect URLs set
  - SMTP enabled with Resend
- Resend domain status is `verified`.
- Sentry DSN/build credentials are configured.

## DB / migrations checklist
- Before release:
  - `pnpm db:migrate`
  - `pnpm db:health`
- After release:
  - smoke query and app health endpoint.

## Cron checklist (planned slices)
- End campaigns by `end_at`.
- Generate reminders (enqueue outbox).
- Dispatch outbox.
- Retry failed outbox/ai jobs with bounded attempts.

## Incident handling
- Beta incident: revert PR in `develop`.
- Prod incident: revert PR in `main`, then sync `main -> develop`.
- Post-incident: add operator note in relevant operations doc (git flow, deployment architecture, dns).
