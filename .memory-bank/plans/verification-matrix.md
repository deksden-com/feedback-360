# Verification matrix (FT/GS → automated tests)
Status: Draft (2026-03-03)

Цель: SSoT “что именно надо запустить”, чтобы считать фичу реализованной (и чтобы ИИ-агент мог автоматически проверить готовность).

Ссылки (аннотированные):
- [Epic plans index](epics/index.md): где лежат FT-документы и acceptance. Читать, чтобы перейти от FT → детали реализации.
- [Scenario catalog](../spec/testing/scenarios/index.md): GS* сценарии и их intent. Читать, чтобы понимать, какие инварианты должны быть зелёными.
- [Testing standards](../spec/engineering/testing-standards.md): где класть FT/GS тесты и соглашения по именованию. Читать, чтобы тесты можно было запускать детерминированно.

Формат ниже:
- `FT`: фича (acceptance — в FT doc).
- `Must add test`: какой automated test добавляем (target path).
- `Must run`: какой сценарий(и) считаем обязательными зелёными.

## Evidence policy (mandatory)
Цель: чтобы “готово” означало **проверено** и это можно было воспроизвести спустя время.

Правило: для каждого PR, который закрывает/двигает FT/EP, в этом документе обновляем evidence:
- добавляем/обновляем секцию `### EP-XXX execution evidence (YYYY-MM-DD)` в нужном эпике,
- на каждую затронутую фичу — строка вида `- FT-XXXX: ...`.

Минимальный состав evidence (в одной строке, через `;` допустимо):
- `what`: какие FT/GS/acceptance закрывали,
- `where`: где гоняли (CI/local/beta) + при необходимости ссылка на CI run / Vercel preview,
- `how`: команды/сценарии (что именно запускали),
- `result`: passed/failed + важные детали (например, “against Supabase beta pooler”, “HMAC replay covered”).

Связанные правила:
- PR/commit traceability и обязательность evidence определены в:
  - [Git flow](../spec/operations/git-flow.md) — правила тегов `[FT-*]/[EP-*]`, обязательных ссылок и pre-merge проверок. Читать, чтобы evidence в matrix всегда был привязан к конкретному PR/фиче.

## EP-000 Foundation
- FT-0001
  - Must add test: `packages/config/test/ft-0001-smoke.test.ts` (или эквивалент) + CI workflow проверки.
  - Must run: “Acceptance (auto)” из FT-0001 (`pnpm -r lint/typecheck/test`).
- FT-0002
  - Must add test: `packages/db/test/ft-0002-migrations-health.test.ts`
  - Must run: migrate + health-check.
- FT-0003
  - Must add test: `packages/db/test/ft-0003-seed-runner.test.ts`
  - Must run: `seed.run` для `S1_company_min`/`S2_org_basic` (и variants smoke).

### EP-000 execution evidence (2026-03-04)
- FT-0001: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` — passed.
- FT-0002: `pnpm db:health`, `pnpm db:migrate`, `packages/db` integration tests — passed against Supabase beta pooler.
- FT-0003: `pnpm seed --scenario S1_company_min --json` и `S2_org_basic` — passed (valid handles JSON).
- FT-0004: `vercel dns ls go360go.ru` + Resend API `GET /domains` — records present, domain status `verified`.
- FT-0005: `next dev` + `GET /api/health` (HTTP 200), `next build` — passed.
- FT-0006: Sentry env build passed; intentional API error produced `Captured error event` in SDK debug logs.

## EP-001 Core + Contract + Client + CLI-first
- FT-0011
  - Must add test: `packages/core/test/ft/ft-0011-op-errors.test.ts`
  - Must run: invalid input → `invalid_input`, RBAC → `forbidden`, dispatcher happy-path/unknown-op typed response, CLI `--json` shape.
- FT-0012
  - Must add test: `packages/client/test/ft/ft-0012-transport-parity.test.ts`
  - Must add test: `packages/client/test/ft/ft-0012-active-company-context.test.ts`
  - Must run: `system.ping` parity (HTTP vs in-proc) + `client.setActiveCompany` no-network + context propagation parity.
- FT-0013
  - Must add test: `packages/core/test/ft/ft-0013-questionnaires.test.ts`
  - Must run: list/saveDraft/submit flow + submitted immutability (`saveDraft` after submit forbidden) + GS5/GS1 regressions.

## EP-002 Identity, tenancy, RBAC
- FT-0021
  - Must add test: `packages/core/test/ft/ft-0021-multi-tenant.test.ts`
  - Must run: GS4.
- FT-0022
  - Must add test: `packages/core/test/ft/ft-0022-rbac.test.ts`
  - Must run: GS4.
- FT-0023
  - Must add test: `packages/db/test/ft/ft-0023-rls-smoke.test.ts`
  - Must run: GS10.

## EP-003 Org structure + snapshots
- FT-0031
  - Must add test: `packages/core/test/ft/ft-0031-org-history.test.ts`
  - Must run: history закрывает `end_at` и soft delete исключает из active списков.
- FT-0032
  - Must add test: `packages/core/test/ft/ft-0032-snapshot.test.ts`
  - Must run: GS8.
- FT-0033
  - Must add test: `packages/core/test/ft/ft-0033-matrix-autogen.test.ts`
  - Must run: GS11.

## EP-004 Models + campaigns + questionnaires
- FT-0041
  - Must add test: `packages/core/test/ft/ft-0041-models.test.ts`
  - Must run: модель создаётся и используется кампанией; валидации шкалы.
- FT-0042
  - Must add test: `packages/core/test/ft/ft-0042-campaign-lifecycle.test.ts`
  - Must run: переходы status + idempotency/ошибки.
- FT-0043
  - Must add test: `packages/core/test/ft/ft-0043-started-immutability.test.ts`
  - Must run: GS6.
- FT-0044
  - Must add test: `packages/core/test/ft/ft-0044-lock-on-draft-save.test.ts`
  - Must run: GS5.
- FT-0045
  - Must add test: `packages/core/test/ft/ft-0045-ended-readonly.test.ts`
  - Must run: попытки save/submit после ended → `campaign_ended_readonly`.
- FT-0046
  - Must add test: `packages/core/test/ft/ft-0046-campaign-progress.test.ts`
  - Must run: GS12.

## EP-005 Results + anonymity + weights
- FT-0051
  - Must add test: `packages/core/test/ft/ft-0051-indicators-aggregations.test.ts`
  - Must run: NA исключение + equal rater weighting.
- FT-0052
  - Must add test: `packages/core/test/ft/ft-0052-anonymity.test.ts`
  - Must run: GS2.
- FT-0053
  - Must add test: `packages/core/test/ft/ft-0053-weight-normalization.test.ts`
  - Must run: missing/hidden groups → effective weights.
- FT-0054
  - Must add test: `packages/core/test/ft/ft-0054-levels.test.ts`
  - Must run: GS9.
- FT-0055
  - Must add test: `packages/core/test/ft/ft-0055-results-views.test.ts`
  - Must run: role-based shaping (raw vs processed) + anonymity flags.

## EP-006 Notifications outbox (email)
- FT-0061
  - Must add test: `packages/core/test/ft/ft-0061-outbox-dispatch.test.ts`
  - Must run: outbox status + attempts.
- FT-0062
  - Must add test: `packages/core/test/ft/ft-0062-idempotency-retries.test.ts`
  - Must run: GS7.
- FT-0063
  - Must add test: `packages/core/test/ft/ft-0063-scheduling.test.ts`
  - Must run: planner timezone/quiet hours.
- FT-0064
  - Must add test: `packages/core/test/ft/ft-0064-campaign-invites.test.ts`
  - Must run: GS13.

## EP-007 AI processing + webhook security
- FT-0071
  - Must add test: `packages/core/test/ft/ft-0071-ai-run.test.ts`
  - Must run: idempotent runForCampaign + status transition to `processing_ai`.
- FT-0072
  - Must add test: `apps/web/test/ft/ft-0072-webhook-security.test.ts` (или equivalent route-handler integration)
  - Must run: GS3.
- FT-0073
  - Must add test: `packages/core/test/ft/ft-0073-processed-text-visibility.test.ts`
  - Must run: employee/manager без raw, HR с raw.

## EP-008 Minimal UI (thin)
- FT-0081..FT-0084
  - Must add test: `apps/web/playwright/gs1-happy-path.spec.ts` (минимальный), плюс точечные UI assertions по ролям.
  - Must run: Playwright flow (GS1) + smoke на company switcher/results visibility.
