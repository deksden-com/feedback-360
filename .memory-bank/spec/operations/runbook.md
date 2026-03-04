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
2. Verify required GitHub checks for merge commit in `develop` are `success`.
   - минимум: workflow `ci.yml` (`checks`).
   - если появились дополнительные required checks — все должны быть зелёными.
3. Verify beta deployment (`beta.go360go.ru`):
   - app health endpoint
   - auth redirect and magic-link flow
   - core smoke scenarios (seed/migrations/tests)
   - Vercel deployment status: `Ready` (без build/runtime errors).
4. Merge `develop -> main`.
5. Verify production deployment (`go360go.ru`) with smoke checks:
   - required GitHub checks on merge commit in `main` = `success`,
   - Vercel deployment status for `go360go-prod` = `Ready`.

## CI/CD verification commands (operator quick-check)
- GitHub Actions (latest runs):
  - `gh run list --repo deksden-com/feedback-360 --workflow ci.yml --limit 10`
  - `gh run view <run-id> --repo deksden-com/feedback-360`
- Commit checks:
  - `gh api repos/deksden-com/feedback-360/commits/<sha>/check-runs`
- Branch protection:
  - `gh api repos/deksden-com/feedback-360/branches/develop/protection`
  - `gh api repos/deksden-com/feedback-360/branches/main/protection`
- Vercel deployments:
  - `vercel list go360go-beta`
  - `vercel list go360go-prod`
  - `vercel inspect <deployment-url> --logs`

## Check failure handling (fix-loop)
- Если CI/check-run в GitHub failed: исправляем причину, запускаем новый run, обновляем evidence ссылкой на зелёный run.
- Если deployment в Vercel failed: читаем `vercel inspect --logs`, фиксируем root cause, исправляем конфигурацию/код, повторяем deploy до `Ready`.
- До зелёного состояния merge/release не продолжаем.

## Current status snapshot (2026-03-04, after CI/CD hardening)
- GitHub Actions (`ci.yml`) на `develop`: `success` (последний run для `791ff57`).
- Branch protection: включена для `develop` и `main`:
  - required checks: `checks`, `Vercel Preview Comments`,
  - merge только через PR, force-push/delete запрещены, conversation resolution включён.
- Vercel projects:
  - `go360go-beta` и `go360go-prod` переведены на `framework=nextjs`, build/dev команды: `pnpm build` / `pnpm dev`, root directory=`apps/web`.
  - после настройки последний deployment `go360go-beta` имеет статус `Ready` (production target),
  - последний deployment `go360go-prod` имеет статус `Ready` (preview target).
- Sentry build-token remediation:
  - удалены `SENTRY_AUTH_TOKEN` из Vercel env (beta/prod), чтобы остановить падения build на `Invalid token (401)`;
  - runtime DSN/ORG/PROJECT сохранены.

### Remaining operational follow-up
1. Добавить валидный `SENTRY_AUTH_TOKEN` обратно (beta/prod), если нужен sourcemap upload в CI/CD.
2. После следующего merge в `main` зафиксировать первый `go360go-prod` deployment со статусом `Ready` на production target.

## Environment checklist
- Vercel env vars are present and mapped to the right environment.
- `AI_WEBHOOK_SECRET` задан в Vercel env для beta/prod и совпадает с секретом подписи на стороне AI сервиса.
- Supabase Auth is configured:
  - public signups OFF
  - site URL and redirect URLs set
  - SMTP enabled with Resend
- Resend domain status is `verified`.
- Sentry DSN/build credentials are configured.

## DB / migrations checklist
- Перед запуском DB-команд убедиться, что выставлен `SUPABASE_DB_POOLER_URL` (preferred) или `DATABASE_URL` (fallback).
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
