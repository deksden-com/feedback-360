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
- синхронизируем evidence с FT-документом: в фиче должны быть заполнены блоки `Quality checks evidence` и `Acceptance evidence`.

Минимальный состав evidence (в одной строке, через `;` допустимо):
- `what`: какие FT/GS/acceptance закрывали,
- `where`: где гоняли (CI/local/beta) + при необходимости ссылка на CI run / Vercel preview,
- `how`: команды/сценарии (что именно запускали),
- `quality_gate`: результаты `lint/typecheck/test` (+ `build`, где применимо),
- `acceptance_gate`: результаты `Acceptance (auto)` по FT и обязательных GS,
- `result`: passed/failed + важные детали (например, “against Supabase beta pooler”, “HMAC replay covered”).
- `artifacts` (optional): ссылки на скриншоты/видео/логи, если это повышает проверяемость (особенно UI/внешние панели).

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
- FT-0001: what=workspace scaffold checks; where=local; how=`pnpm -r lint && pnpm -r typecheck && pnpm -r test`; quality_gate=passed; acceptance_gate=passed (FT-0001 acceptance); result=passed.
- FT-0002: what=db migrations baseline; where=local+Supabase beta pooler; how=`pnpm db:health`, `pnpm db:migrate`, `pnpm --filter @feedback-360/db test`; quality_gate=passed (`lint/typecheck/test`); acceptance_gate=passed (migrate+health+integration); result=passed.
- FT-0003: what=seed runner handles; where=local; how=`pnpm seed --scenario S1_company_min --json`, `pnpm seed --scenario S2_org_basic --json`, `pnpm --filter @feedback-360/db test`; quality_gate=passed (`lint/typecheck/test`); acceptance_gate=passed (valid handles JSON + integration); result=passed.
- FT-0004: what=domains/dns/resend setup; where=Vercel DNS + Resend; how=`vercel dns ls go360go.ru`, `GET /domains` Resend API; quality_gate=N/A (infra/docs-only); acceptance_gate=passed (records present + domain verified); result=passed.
- FT-0005: what=web app scaffold; where=local; how=`next dev`, `GET /api/health`, `pnpm --filter @feedback-360/web build`; quality_gate=passed (`lint/typecheck/test` workspace gate); acceptance_gate=passed (health endpoint + build smoke); result=passed.
- FT-0006: what=Sentry integration; where=local (beta env config); how=`pnpm --filter @feedback-360/web build` with Sentry env + intentional API error route; quality_gate=passed (`lint/typecheck/test` workspace gate); acceptance_gate=passed (event captured in SDK logs); result=passed.

## EP-001 Core + Contract + Client + CLI-first
- FT-0011
  - Must add test: `packages/core/src/ft/ft-0011-op-errors.test.ts`
  - Must add test: `packages/cli/src/ft-0011-cli-json-error.test.ts`
  - Must run: invalid input → `invalid_input`, RBAC → `forbidden`, dispatcher happy-path/unknown-op typed response, CLI `--json` shape.
- FT-0012
  - Must add test: `packages/client/src/ft-0012-transport-parity.test.ts`
  - Must add test: `packages/client/src/ft-0012-active-company-context.test.ts`
  - Must run: `system.ping` parity (HTTP vs in-proc) + `client.setActiveCompany` no-network + context propagation parity.
- FT-0013
  - Must add test: `packages/core/src/ft/ft-0013-questionnaires-no-db.test.ts`
  - Must add test: `packages/core/src/ft/ft-0013-questionnaires.test.ts`
  - Must add test: `packages/cli/src/ft-0013-questionnaire-cli.test.ts`
  - Must run: list/saveDraft/submit flow + submitted immutability (`saveDraft` after submit forbidden) + GS5/GS1 regressions.

### EP-001 execution evidence (2026-03-04)
- FT-0011: what=operation plumbing + typed errors; where=local; how=`pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0011-op-errors.test.ts`, `pnpm --filter @feedback-360/cli exec tsx src/index.ts -- --scenario UNKNOWN --json`; quality_gate=passed; acceptance_gate=passed (core integration + CLI json error shape, exit code 1); result=passed.
- FT-0012: what=typed client transport parity + active company context; where=local; how=`pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @feedback-360/client exec vitest run src/ft-0012-transport-parity.test.ts`, `pnpm --filter @feedback-360/client exec vitest run src/ft-0012-active-company-context.test.ts`; quality_gate=passed; acceptance_gate=passed (HTTP/in-proc parity, no-network setActiveCompany, context propagation parity); result=passed.
- FT-0013: what=questionnaire ops + CLI flow; where=local; how=`pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0013-questionnaires-no-db.test.ts`, `pnpm --filter @feedback-360/cli exec vitest run src/ft-0013-questionnaire-cli.test.ts`, `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0013-questionnaires.test.ts`; quality_gate=passed; acceptance_gate=passed (list/saveDraft/submit, lock, idempotent re-submit, immutable after submit; DB integration test skips when DB URL absent); result=passed.

## EP-002 Identity, tenancy, RBAC
- FT-0021
  - Must add test: `packages/client/src/ft-0021-multi-tenant.test.ts`
  - Must run: GS4 tenant-isolation subset (`client.setActiveCompany` + company-scoped read isolation).
- FT-0022
  - Must add test: `packages/core/src/ft/ft-0022-rbac-no-db.test.ts`
  - Must add test: `packages/core/src/ft/ft-0022-rbac.test.ts`
  - Must run: GS4 RBAC subset (hr_reader read allowed + write forbidden + no partial changes).
- FT-0023
  - Must add test: `packages/db/src/migrations/ft-0023-rls-smoke.test.ts`
  - Must run: GS10 (RLS row filtering for user context + service-role bypass).

### EP-002 execution evidence (2026-03-04)
- FT-0021: what=identity multi-tenant baseline + active company isolation; where=local; how=`pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @feedback-360/client exec vitest run src/ft-0021-multi-tenant.test.ts`, `pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts`; quality_gate=passed; acceptance_gate=passed (active company A/B isolation, cross-company read -> `not_found`, `S1_multi_tenant_min` handles validated; DB integration subtest skips when DB URL absent); result=passed.
- FT-0022: what=RBAC enforcement for hr_reader (read-only); where=local; how=`pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0022-rbac-no-db.test.ts`, `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0022-rbac.test.ts`; quality_gate=passed; acceptance_gate=passed (`questionnaire.listAssigned` allowed, `questionnaire.saveDraft`/`questionnaire.submit`/`company.updateProfile` forbidden, no partial changes; DB integration subtest skips when DB URL absent); result=passed.
- FT-0023: what=RLS deny-by-default + service-role contours; where=local; how=`pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0023-rls-smoke.test.ts`; quality_gate=passed; acceptance_gate=passed (user-context sees only own company rows, foreign rows hidden by RLS, service-role context can read target row; integration subtest skips when DB URL absent); result=passed.

## EP-003 Org structure + snapshots
- FT-0031
  - Must add test: `packages/core/src/ft/ft-0031-org-history-no-db.test.ts`
  - Must add test: `packages/core/src/ft/ft-0031-org-history.test.ts`
  - Must add test: `packages/cli/src/ft-0031-org-cli.test.ts`
  - Must run: history закрывает `end_at` и soft delete исключает из active списков выбора.
- FT-0032
  - Must add test: `packages/core/src/ft/ft-0032-snapshot-no-db.test.ts`
  - Must add test: `packages/core/src/ft/ft-0032-snapshot.test.ts`
  - Must add test: `packages/cli/src/ft-0032-campaign-snapshot-cli.test.ts`
  - Must run: GS8.
- FT-0033
  - Must add test: `packages/core/src/ft/ft-0033-matrix-autogen-no-db.test.ts`
  - Must add test: `packages/core/src/ft/ft-0033-matrix-autogen.test.ts`
  - Must add test: `packages/cli/src/ft-0033-matrix-cli.test.ts`
  - Must run: GS11.

### EP-003 execution evidence (2026-03-04)
- FT-0031: what=org history ops (`org.department.move`, `org.manager.set`) + employee soft deactivate/list-active filtering; where=local; how=`pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0031-org-history-no-db.test.ts src/ft/ft-0031-org-history.test.ts`, `pnpm --filter @feedback-360/cli exec vitest run src/ft-0031-org-cli.test.ts`; quality_gate=passed; acceptance_gate=passed (history intervals + active list filtering; DB integration subtest skipped без `SUPABASE_DB_POOLER_URL`/`DATABASE_URL`); result=passed.
- FT-0032: what=campaign snapshot immutability after campaign start; where=local; how=`pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0032-snapshot-no-db.test.ts src/ft/ft-0032-snapshot.test.ts`, `pnpm --filter @feedback-360/cli exec vitest run src/ft-0032-campaign-snapshot-cli.test.ts`; quality_gate=passed; acceptance_gate=passed (snapshot unchanged after live org updates; DB integration subtest skipped без `SUPABASE_DB_POOLER_URL`/`DATABASE_URL`); result=passed.
- FT-0033: what=participants add-from-departments + matrix autogeneration rules; where=local; how=`pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0033-matrix-autogen-no-db.test.ts src/ft/ft-0033-matrix-autogen.test.ts`, `pnpm --filter @feedback-360/cli exec vitest run src/ft-0033-matrix-cli.test.ts`; quality_gate=passed; acceptance_gate=passed (heads are peers, department staff mapped to correct managers, add-departments idempotent baseline covered; DB integration subtest skipped без `SUPABASE_DB_POOLER_URL`/`DATABASE_URL`); result=passed.

## EP-004 Models + campaigns + questionnaires
- FT-0041
  - Must add test: `packages/core/src/ft/ft-0041-models-no-db.test.ts`
  - Must add test: `packages/core/src/ft/ft-0041-models.test.ts`
  - Must add test: `packages/client/src/ft-0041-model-campaign-client.test.ts`
  - Must add test: `packages/cli/src/ft-0041-model-campaign-cli.test.ts`
  - Must run: модель создаётся и используется кампанией; невалидные веса модели отвергаются `invalid_input`.
- FT-0042
  - Must add test: `packages/core/src/ft/ft-0042-campaign-lifecycle-no-db.test.ts`
  - Must add test: `packages/core/src/ft/ft-0042-campaign-lifecycle.test.ts`
  - Must add test: `packages/client/src/ft-0042-campaign-lifecycle-client.test.ts`
  - Must add test: `packages/cli/src/ft-0042-campaign-lifecycle-cli.test.ts`
  - Must run: переходы status + idempotency/ошибки.
- FT-0043
  - Must add test: `packages/core/src/ft/ft-0043-started-immutability-no-db.test.ts`
  - Must add test: `packages/core/src/ft/ft-0043-started-immutability.test.ts`
  - Must add test: `packages/client/src/ft-0043-started-immutability-client.test.ts`
  - Must add test: `packages/cli/src/ft-0043-started-immutability-cli.test.ts`
  - Must run: GS6.
- FT-0044
  - Must add test: `packages/core/src/ft/ft-0044-lock-on-draft-save.test.ts`
  - Must run: GS5.
- FT-0045
  - Must add test: `packages/core/src/ft/ft-0045-ended-readonly.test.ts`
  - Must run: попытки save/submit после ended → `campaign_ended_readonly`.
- FT-0046
  - Must add test: `packages/core/src/ft/ft-0046-campaign-progress.test.ts`
  - Must run: GS12.

### EP-004 execution evidence (2026-03-04)
- FT-0041: what=competency model versions + campaign create vertical slice (`model.version.create`, `campaign.create`); where=local; how=`pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0041-models-no-db.test.ts src/ft/ft-0041-models.test.ts`, `pnpm --filter @feedback-360/client exec vitest run src/ft-0041-model-campaign-client.test.ts`, `pnpm --filter @feedback-360/cli exec vitest run src/ft-0041-model-campaign-cli.test.ts`; quality_gate=passed; acceptance_gate=passed (HR creates model version and linked draft campaign; invalid weights -> `invalid_input`; DB integration subtests skipped without DB URL); result=passed.
- FT-0042: what=campaign lifecycle transitions (`campaign.start`, `campaign.stop`, `campaign.end`) with idempotent repeats; where=local; how=`pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0042-campaign-lifecycle-no-db.test.ts src/ft/ft-0042-campaign-lifecycle.test.ts`, `pnpm --filter @feedback-360/client exec vitest run src/ft-0042-campaign-lifecycle-client.test.ts`, `pnpm --filter @feedback-360/cli exec vitest run src/ft-0042-campaign-lifecycle-cli.test.ts`; quality_gate=passed; acceptance_gate=passed (draft->started and started->ended transitions, repeats no-op in target status, invalid reverse transition -> `invalid_transition`, non-HR role -> `forbidden`; DB integration subtests skipped without DB URL); result=passed.
- FT-0043: what=started immutability for model and participants (`campaign.setModelVersion`, `campaign.participants.add/remove`); where=local; how=`pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0043-started-immutability-no-db.test.ts src/ft/ft-0043-started-immutability.test.ts`, `pnpm --filter @feedback-360/client exec vitest run src/ft-0043-started-immutability-client.test.ts`, `pnpm --filter @feedback-360/cli exec vitest run src/ft-0043-started-immutability-cli.test.ts`; quality_gate=passed; acceptance_gate=passed (before start mutations succeed, after start all mutations fail with `campaign_started_immutable`; DB integration subtests skipped without DB URL); result=passed.

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
  - Must add test: `packages/core/src/ft/ft-0071-ai-run-no-db.test.ts`
  - Must add test: `packages/core/src/ft/ft-0071-ai-run.test.ts`
  - Must add test: `packages/client/src/ft-0071-ai-client.test.ts`
  - Must add test: `packages/cli/src/ft-0071-ai-cli.test.ts`
  - Must run: idempotent `ai.runForCampaign` + status transition to `completed` (MVP `mvp_stub`) + no duplicate `ai_jobs`.
- FT-0072
  - Must add test: `apps/web/src/app/api/webhooks/ai/route.test.ts` (route-handler integration)
  - Must add test: `packages/db/src/ft/ft-0072-ai-webhook.test.ts` (DB idempotency/status integration)
  - Must run: GS3.
- FT-0073
  - Must add test: `packages/core/test/ft/ft-0073-processed-text-visibility.test.ts`
  - Must run: employee/manager без raw, HR с raw.

### EP-007 execution evidence (2026-03-04)
- FT-0071: what=AI run MVP stub (`ai_jobs` + `ai.runForCampaign`) with idempotent completion; where=local; how=`pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0071-ai-run-no-db.test.ts src/ft/ft-0071-ai-run.test.ts`, `pnpm --filter @feedback-360/client exec vitest run src/ft-0071-ai-client.test.ts`, `pnpm --filter @feedback-360/cli exec vitest run src/ft-0071-ai-cli.test.ts`; quality_gate=passed; acceptance_gate=passed (first run -> completed, second run -> `wasAlreadyCompleted=true`, no duplicate job; DB integration subtest skipped without DB URL); result=passed.
- FT-0072: what=AI webhook security + idempotency receipts (`POST /api/webhooks/ai`); where=local; how=`pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @feedback-360/web exec vitest run src/app/api/webhooks/ai/route.test.ts`, `pnpm --filter @feedback-360/db exec vitest run src/ft/ft-0072-ai-webhook.test.ts`; quality_gate=passed; acceptance_gate=passed (invalid signature -> 401 + no apply, valid payload -> applied, same idempotency key -> 200 no-op + single receipt; DB integration subtest skipped without DB URL); result=passed.

## EP-008 Minimal UI (thin)
- FT-0081..FT-0084
  - Must add test: `apps/web/playwright/gs1-happy-path.spec.ts` (минимальный), плюс точечные UI assertions по ролям.
  - Must run: Playwright flow (GS1) + smoke на company switcher/results visibility.
