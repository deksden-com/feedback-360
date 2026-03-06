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

Дополнение для user-facing/runtime фич:
- `browser_smoke`: результат прогона через `$agent-browser` на целевом окружении (`beta`/`prod`), включая шаги сценария и скриншоты.

Дополнение для runtime/deploy/integration фич (mandatory):
- `ci_run`: ссылка на GitHub Actions run (или commit check-runs).
- `deploy`: ссылка на Vercel deployment (`Ready`) для затронутого окружения.
- Если был fail перед фиксом: короткий `root_cause` и ссылка на успешный rerun/redeploy.

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
  - Must add test: `packages/core/src/ft/ft-0044-lock-on-draft-save-no-db.test.ts`
  - Must add test: `packages/core/src/ft/ft-0044-lock-on-draft-save.test.ts`
  - Must add test: `packages/client/src/ft-0044-lock-on-draft-save-client.test.ts`
  - Must add test: `packages/cli/src/ft-0044-lock-on-draft-save-cli.test.ts`
  - Must run: GS5.
- FT-0045
  - Must add test: `packages/core/src/ft/ft-0045-ended-readonly.test.ts`
  - Must run: попытки save/submit после ended → `campaign_ended_readonly`.
- FT-0046
  - Must add test: `packages/core/src/ft/ft-0046-campaign-progress.test.ts`
  - Must add test: `packages/cli/src/ft-0046-campaign-progress-cli.test.ts`
  - Must run: GS12.

### EP-004 execution evidence (2026-03-04)
- FT-0041: what=competency model versions + campaign create vertical slice (`model.version.create`, `campaign.create`); where=local; how=`pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0041-models-no-db.test.ts src/ft/ft-0041-models.test.ts`, `pnpm --filter @feedback-360/client exec vitest run src/ft-0041-model-campaign-client.test.ts`, `pnpm --filter @feedback-360/cli exec vitest run src/ft-0041-model-campaign-cli.test.ts`; quality_gate=passed; acceptance_gate=passed (HR creates model version and linked draft campaign; invalid weights -> `invalid_input`; DB integration subtests skipped without DB URL); result=passed.
- FT-0042: what=campaign lifecycle transitions (`campaign.start`, `campaign.stop`, `campaign.end`) with idempotent repeats; where=local; how=`pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0042-campaign-lifecycle-no-db.test.ts src/ft/ft-0042-campaign-lifecycle.test.ts`, `pnpm --filter @feedback-360/client exec vitest run src/ft-0042-campaign-lifecycle-client.test.ts`, `pnpm --filter @feedback-360/cli exec vitest run src/ft-0042-campaign-lifecycle-cli.test.ts`; quality_gate=passed; acceptance_gate=passed (draft->started and started->ended transitions, repeats no-op in target status, invalid reverse transition -> `invalid_transition`, non-HR role -> `forbidden`; DB integration subtests skipped without DB URL); result=passed.
- FT-0043: what=started immutability for model and participants (`campaign.setModelVersion`, `campaign.participants.add/remove`); where=local; how=`pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0043-started-immutability-no-db.test.ts src/ft/ft-0043-started-immutability.test.ts`, `pnpm --filter @feedback-360/client exec vitest run src/ft-0043-started-immutability-client.test.ts`, `pnpm --filter @feedback-360/cli exec vitest run src/ft-0043-started-immutability-cli.test.ts`; quality_gate=passed; acceptance_gate=passed (before start mutations succeed, after start all mutations fail with `campaign_started_immutable`; DB integration subtests skipped without DB URL); result=passed.
- FT-0044: what=lock semantics on first draft save for matrix/weights (`questionnaire.saveDraft`, `campaign.weights.set`, `matrix.set`); where=local + Supabase beta pooler; how=`pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0044-lock-on-draft-save-no-db.test.ts src/ft/ft-0044-lock-on-draft-save.test.ts`, `pnpm --filter @feedback-360/client exec vitest run src/ft-0044-lock-on-draft-save-client.test.ts`, `pnpm --filter @feedback-360/cli exec vitest run src/ft-0044-lock-on-draft-save-cli.test.ts`; quality_gate=passed; acceptance_gate=passed (до lock изменения матрицы/весов разрешены, после первого draft-save обе операции возвращают `campaign_locked`; integration subtest executed on real DB, no skip); result=passed.
- FT-0045: what=ended read-only enforcement for questionnaire writes (`questionnaire.saveDraft`, `questionnaire.submit`) including downstream statuses (`processing_ai|ai_failed|completed`); where=local + Supabase beta pooler + CLI scenario on real DB; how=`pnpm --filter @feedback-360/db lint`, `pnpm --filter @feedback-360/db typecheck`, `pnpm --filter @feedback-360/core lint`, `pnpm --filter @feedback-360/core typecheck`, `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0045-ended-readonly.test.ts`, `set -a; source .env; set +a; pnpm exec tsx packages/cli/src/index.ts --scenario S8_campaign_ended --json` + `company use` + `questionnaire list/save-draft/submit` checks; quality_gate=passed (lint/typecheck on changed packages), acceptance_gate=passed (both ops return `campaign_ended_readonly`; questionnaire remains `not_started`); result=passed.
- FT-0046: what=campaign progress operation (`campaign.progress.get`) + CLI command + seed `S7`; where=local + Supabase beta pooler + CLI scenario on real DB; how=`pnpm --filter @feedback-360/api-contract lint`, `pnpm --filter @feedback-360/api-contract typecheck`, `pnpm --filter @feedback-360/db lint`, `pnpm --filter @feedback-360/db typecheck`, `pnpm --filter @feedback-360/core lint`, `pnpm --filter @feedback-360/core typecheck`, `pnpm --filter @feedback-360/client lint`, `pnpm --filter @feedback-360/client typecheck`, `pnpm --filter @feedback-360/cli lint`, `pnpm --filter @feedback-360/cli typecheck`, `set -a; source .env; set +a; pnpm db:migrate`, `pnpm --filter @feedback-360/cli exec vitest run src/ft-0046-campaign-progress-cli.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0046-campaign-progress.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts`; quality_gate=passed; acceptance_gate=passed (`statusCounts={1,1,1}`, `pending=2`, employee/manager -> `forbidden`); result=passed.

## EP-005 Results + anonymity + weights
- FT-0051
  - Must add test: `packages/core/src/ft/ft-0051-indicators-aggregations.test.ts`
  - Must add test: `packages/cli/src/ft-0051-results-hr-cli.test.ts`
  - Must run: NA исключение + equal rater weighting + RBAC (`employee` → `forbidden`) для `results.getHrView`.
- FT-0052
  - Must add test: `packages/core/src/ft/ft-0052-anonymity.test.ts`
  - Must add test: `packages/cli/src/ft-0052-results-hr-anonymity-cli.test.ts`
  - Must run: GS2 (`hide` и `merge_to_other`) + per-competency threshold on merged group.
- FT-0053
  - Must add test: `packages/core/src/ft/ft-0053-weight-normalization.test.ts`
  - Must run: missing/hidden groups → effective weights + `overallScore` consistency.
- FT-0054
  - Must add test: `packages/core/src/ft/ft-0054-levels.test.ts`
  - Must run: GS9.
- FT-0055
  - Must add test: `packages/core/src/ft/ft-0055-results-views.test.ts`
  - Must run: role-based shaping (raw vs processed) + anonymity flags.

### EP-005 execution evidence (2026-03-05)
- FT-0051: what=indicator aggregations (`results.getHrView`) с NA exclusion + equal-rater weighting; where=local + Supabase beta pooler + CLI scenario on real DB; how=`pnpm --filter @feedback-360/api-contract lint`, `pnpm --filter @feedback-360/api-contract typecheck`, `pnpm --filter @feedback-360/api-contract test`, `pnpm --filter @feedback-360/db lint`, `pnpm --filter @feedback-360/db typecheck`, `pnpm --filter @feedback-360/core lint`, `pnpm --filter @feedback-360/core typecheck`, `pnpm --filter @feedback-360/client lint`, `pnpm --filter @feedback-360/client typecheck`, `pnpm --filter @feedback-360/cli lint`, `pnpm --filter @feedback-360/cli typecheck`, `pnpm --filter @feedback-360/cli exec vitest run src/ft-0051-results-hr-cli.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0051-indicators-aggregations.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts`; quality_gate=passed; acceptance_gate=passed (`S7 --variant na_heavy_peer`: `peers_score=3`, `naive_indicator_weighted=2`, `employee -> forbidden`); result=passed.
- FT-0052: what=anonymity visibility policy (`hide`/`merge_to_other`) + per-competency threshold on `results.getHrView`; where=local + Supabase beta pooler + CLI scenario on real DB; how=`pnpm --filter @feedback-360/api-contract lint`, `pnpm --filter @feedback-360/api-contract typecheck`, `pnpm --filter @feedback-360/db lint`, `pnpm --filter @feedback-360/db typecheck`, `pnpm --filter @feedback-360/core lint`, `pnpm --filter @feedback-360/core typecheck`, `pnpm --filter @feedback-360/client lint`, `pnpm --filter @feedback-360/client typecheck`, `pnpm --filter @feedback-360/cli lint`, `pnpm --filter @feedback-360/cli typecheck`, `pnpm --filter @feedback-360/cli exec vitest run src/ft-0051-results-hr-cli.test.ts src/ft-0052-results-hr-anonymity-cli.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0051-indicators-aggregations.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0052-anonymity.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts`; quality_gate=passed; acceptance_gate=passed (`S7 --variant peers2`: hide=`peers/subordinates hidden`; merge=`other shown`; per-competency=`competency.secondary.otherVisibility=hidden`; employee->`forbidden`); result=passed.
- FT-0053: what=weights normalization and overall score (`configuredGroupWeights`/`effectiveGroupWeights`/`overallScore`) in `results.getHrView`; where=local + Supabase beta pooler + CLI scenario on real DB; how=`pnpm --filter @feedback-360/api-contract lint`, `pnpm --filter @feedback-360/api-contract typecheck`, `pnpm --filter @feedback-360/db lint`, `pnpm --filter @feedback-360/db typecheck`, `pnpm --filter @feedback-360/core lint`, `pnpm --filter @feedback-360/core typecheck`, `pnpm --filter @feedback-360/client lint`, `pnpm --filter @feedback-360/client typecheck`, `pnpm --filter @feedback-360/cli lint`, `pnpm --filter @feedback-360/cli typecheck`, `pnpm --filter @feedback-360/cli exec vitest run src/ft-0051-results-hr-cli.test.ts src/ft-0052-results-hr-anonymity-cli.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0051-indicators-aggregations.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0052-anonymity.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0053-weight-normalization.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts`; quality_gate=passed; acceptance_gate=passed (`S7 --variant no_subordinates`: effective weights `manager=50, peers=50, subordinates=0, self=0`, `overallScore=3.5`; merge-case `manager=50, other=50`); result=passed.
- FT-0054: what=levels mode/distribution in `results.getHrView` (`modeLevel`, `distribution`, `nValid`, `nUnsure`) with tie→null and UNSURE exclusion; where=local + Supabase beta pooler + CLI scenario on real DB; how=`pnpm --filter @feedback-360/api-contract lint && pnpm --filter @feedback-360/api-contract typecheck`, `pnpm --filter @feedback-360/db lint && pnpm --filter @feedback-360/db typecheck`, `pnpm --filter @feedback-360/core lint && pnpm --filter @feedback-360/core typecheck`, `pnpm --filter @feedback-360/client typecheck`, `pnpm --filter @feedback-360/cli lint && pnpm --filter @feedback-360/cli typecheck`, `pnpm --filter @feedback-360/cli exec vitest run src/ft-0051-results-hr-cli.test.ts src/ft-0052-results-hr-anonymity-cli.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0051-indicators-aggregations.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0052-anonymity.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0053-weight-normalization.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0054-levels.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts`; quality_gate=passed; acceptance_gate=passed (`S7 --variant levels_tie`: `otherLevels.modeLevel=null`, `distribution={level2:2,level3:2}`, `managerLevels.nUnsure=1`, `effectiveGroupWeights.other=100`, `overallScore=2.5`); result=passed.
- FT-0055: what=role-based result dashboards (`results.getMyDashboard`, `results.getTeamDashboard`) + HR open-text extension with raw/processed shaping; where=local + Supabase beta pooler + CLI scenario on real DB; how=`pnpm --filter @feedback-360/api-contract lint && pnpm --filter @feedback-360/api-contract typecheck && pnpm --filter @feedback-360/db lint && pnpm --filter @feedback-360/db typecheck && pnpm --filter @feedback-360/core lint && pnpm --filter @feedback-360/core typecheck && pnpm --filter @feedback-360/client lint && pnpm --filter @feedback-360/client typecheck && pnpm --filter @feedback-360/cli lint && pnpm --filter @feedback-360/cli typecheck`, `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0055-results-views.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0013-questionnaires.test.ts src/ft/ft-0044-lock-on-draft-save.test.ts src/ft/ft-0045-ended-readonly.test.ts --fileParallelism=false`, `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0071-ai-run.test.ts --testTimeout 30000`, CLI checks via `pnpm --filter @feedback-360/cli exec tsx src/index.ts -- results my|team|hr ... --json` + `jq` assertions; quality_gate=passed; acceptance_gate=passed (employee/manager/hr_reader dashboards exclude `rawText`, `hr_admin` keeps `rawText+processedText`, GS1 regression subset green); result=passed.

## EP-006 Notifications outbox (email)
- FT-0061
  - Must add test: `packages/core/src/ft/ft-0061-outbox-dispatch.test.ts`
  - Must run: outbox status + attempts.
- FT-0062
  - Must add test: `packages/core/src/ft/ft-0062-idempotency-retries.test.ts`
  - Must run: GS7.
- FT-0063
  - Must add test: `packages/core/src/ft/ft-0063-scheduling.test.ts`
  - Must run: planner timezone/quiet hours.
- FT-0064
  - Must add test: `packages/core/src/ft/ft-0064-campaign-invites.test.ts`
  - Must run: GS13.

### EP-006 execution evidence (2026-03-05)
- FT-0061: what=notifications outbox baseline (`notifications.generateReminders`, `notifications.dispatchOutbox`) + tables `notification_outbox`/`notification_attempts`; where=local + Supabase beta pooler + CLI scenario on real DB; how=`pnpm --filter @feedback-360/api-contract lint && pnpm --filter @feedback-360/api-contract typecheck && pnpm --filter @feedback-360/db lint && pnpm --filter @feedback-360/db typecheck && pnpm --filter @feedback-360/core lint && pnpm --filter @feedback-360/core typecheck && pnpm --filter @feedback-360/client lint && pnpm --filter @feedback-360/client typecheck && pnpm --filter @feedback-360/cli lint && pnpm --filter @feedback-360/cli typecheck`, `set -a; source .env; set +a; pnpm db:migrate`, `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0061-outbox-dispatch.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/client exec vitest run --testTimeout 30000`, `pnpm --filter @feedback-360/cli test`, CLI checks via `pnpm --filter @feedback-360/cli exec tsx src/index.ts -- reminders generate ... --json` (x2) + `notifications dispatch --provider stub --json` + `jq` assertions; quality_gate=passed; acceptance_gate=passed (first generate creates outbox row, second deduplicates by idempotency key, dispatch logs attempt and moves row to `sent`); result=passed.
- FT-0062: what=retry/backoff/dead-letter semantics + no duplicate outbox rows under repeated generation; where=local + Supabase beta pooler (integration); how=`pnpm --filter @feedback-360/db lint && pnpm --filter @feedback-360/db typecheck && pnpm --filter @feedback-360/core lint && pnpm --filter @feedback-360/core typecheck`, `set -a; source .env; set +a; pnpm db:migrate`, `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0062-idempotency-retries.test.ts`, regressions: `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0061-outbox-dispatch.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts`, `pnpm --filter @feedback-360/client exec vitest run src/ft-0061-notifications-client.test.ts`, `pnpm --filter @feedback-360/cli exec vitest run src/ft-0061-notifications-cli.test.ts`; quality_gate=passed; acceptance_gate=passed (first dispatch schedules retry with `next_retry_at`, immediate redispatch processes `0`, forced due retry dispatches same outbox row to `sent`, attempts=`2`, no duplicate outbox rows); result=passed.
- FT-0063: what=timezone-aware reminder planner (`Mon/Wed/Fri 10:00` local + quiet hours `08:00-20:00`) with campaign/company timezone resolution and deterministic `now` override; where=local + Supabase beta pooler (integration); how=`pnpm --filter @feedback-360/api-contract lint && pnpm --filter @feedback-360/api-contract typecheck && pnpm --filter @feedback-360/db lint && pnpm --filter @feedback-360/db typecheck && pnpm --filter @feedback-360/core lint && pnpm --filter @feedback-360/core typecheck && pnpm --filter @feedback-360/client typecheck && pnpm --filter @feedback-360/cli lint && pnpm --filter @feedback-360/cli typecheck`, `set -a; source .env; set +a; pnpm db:migrate`, `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0061-outbox-dispatch.test.ts src/ft/ft-0062-idempotency-retries.test.ts src/ft/ft-0063-scheduling.test.ts --fileParallelism=false`, `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts`, `pnpm --filter @feedback-360/client exec vitest run src/ft-0061-notifications-client.test.ts`, `pnpm --filter @feedback-360/cli exec vitest run src/ft-0061-notifications-cli.test.ts`; quality_gate=passed; acceptance_gate=passed (outside quiet/schedule -> outbox not generated, inside window -> generated once, repeated same bucket -> deduplicated, outbox rows remain unique); result=passed.
- FT-0064: what=campaign-start invite outbox (`campaign_invite`) with recipients from participants/assignments and idempotent replay on repeated `campaign.start`; where=local + Supabase beta pooler (integration); how=`pnpm --filter @feedback-360/db lint && pnpm --filter @feedback-360/db typecheck && pnpm --filter @feedback-360/core lint && pnpm --filter @feedback-360/core typecheck`, `set -a; source .env; set +a; pnpm db:migrate`, `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0061-outbox-dispatch.test.ts src/ft/ft-0062-idempotency-retries.test.ts src/ft/ft-0063-scheduling.test.ts src/ft/ft-0064-campaign-invites.test.ts --fileParallelism=false`, `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts`, `pnpm --filter @feedback-360/client exec vitest run src/ft-0061-notifications-client.test.ts`, `pnpm --filter @feedback-360/cli exec vitest run src/ft-0061-notifications-cli.test.ts`; quality_gate=passed; acceptance_gate=passed (`campaign.start` creates invite outbox rows once, repeated start keeps row count unchanged, dispatcher marks invite rows as `sent`); result=passed.

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
  - Must add test: `packages/core/src/ft/ft-0073-processed-text-visibility.test.ts`
  - Must add test: `packages/db/src/ft/ft-0073-processed-aggregates.test.ts`
  - Must run: employee/manager без raw, HR с raw + webhook ingestion idempotency.

### EP-007 execution evidence (2026-03-04)
- FT-0071: what=AI run MVP stub (`ai_jobs` + `ai.runForCampaign`) with idempotent completion; where=local; how=`pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0071-ai-run-no-db.test.ts src/ft/ft-0071-ai-run.test.ts`, `pnpm --filter @feedback-360/client exec vitest run src/ft-0071-ai-client.test.ts`, `pnpm --filter @feedback-360/cli exec vitest run src/ft-0071-ai-cli.test.ts`; quality_gate=passed; acceptance_gate=passed (first run -> completed, second run -> `wasAlreadyCompleted=true`, no duplicate job; DB integration subtest skipped without DB URL); result=passed.
- FT-0072: what=AI webhook security + idempotency receipts (`POST /api/webhooks/ai`); where=local; how=`pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, `pnpm --filter @feedback-360/web exec vitest run src/app/api/webhooks/ai/route.test.ts`, `pnpm --filter @feedback-360/db exec vitest run src/ft/ft-0072-ai-webhook.test.ts`; quality_gate=passed; acceptance_gate=passed (invalid signature -> 401 + no apply, valid payload -> applied, same idempotency key -> 200 no-op + single receipt; DB integration subtest skipped without DB URL); result=passed.

### EP-007 execution evidence (2026-03-05)
- FT-0073: what=webhook processed-comments ingestion + visibility shaping (`results.getMyDashboard|getTeamDashboard|getHrView`); where=local + Supabase beta pooler; how=`pnpm --filter @feedback-360/api-contract lint && pnpm --filter @feedback-360/api-contract typecheck && pnpm --filter @feedback-360/db lint && pnpm --filter @feedback-360/db typecheck && pnpm --filter @feedback-360/core lint && pnpm --filter @feedback-360/core typecheck`, `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/ft/ft-0073-processed-aggregates.test.ts`, `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0073-processed-text-visibility.test.ts`, regression: `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/ft/ft-0072-ai-webhook.test.ts --testTimeout 30000`; quality_gate=passed; acceptance_gate=passed (webhook patch updates processed/summary without raw overwrite, duplicate idempotency key no-op, employee/manager output excludes `rawText`, HR output keeps `rawText+processedText+summaryText`); result=passed.

## EP-008 Minimal UI (thin)
- FT-0081..FT-0084
  - Must add test: `apps/web/playwright/gs1-happy-path.spec.ts` (минимальный), плюс точечные UI assertions по ролям.
  - Must run: Playwright flow (GS1) + smoke на company switcher/results visibility.

### EP-008 execution evidence (2026-03-05)
- FT-0081: what=auth + company switcher thin UI (`/auth/login`, `/auth/callback`, `/select-company`) + typed `membership.list`; where=local; how=`pnpm --filter @feedback-360/api-contract lint && pnpm --filter @feedback-360/api-contract typecheck && pnpm --filter @feedback-360/api-contract test`, `pnpm --filter @feedback-360/db lint && pnpm --filter @feedback-360/db typecheck`, `pnpm --filter @feedback-360/client lint && pnpm --filter @feedback-360/client typecheck && pnpm --filter @feedback-360/client exec vitest run src/ft-0081-membership-list-client.test.ts`, `pnpm --filter @feedback-360/core lint && pnpm --filter @feedback-360/core typecheck && set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0081-membership-list-no-db.test.ts src/ft/ft-0081-membership-list.test.ts --fileParallelism=false`, `pnpm --filter @feedback-360/web lint && pnpm --filter @feedback-360/web typecheck && pnpm --filter @feedback-360/web test && pnpm --filter @feedback-360/web build`, `cd apps/web && node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs`; quality_gate=passed; acceptance_gate=passed (Playwright подтверждает login context + switch A→B и корректный active company на root); artifacts=`.memory-bank/evidence/EP-008/FT-0081/2026-03-05/step-01-company-switcher-initial.png`, `.memory-bank/evidence/EP-008/FT-0081/2026-03-05/step-02-active-company-a.png`, `.memory-bank/evidence/EP-008/FT-0081/2026-03-05/step-03-company-switcher-before-b.png`, `.memory-bank/evidence/EP-008/FT-0081/2026-03-05/step-04-active-company-b.png`; result=passed.
- FT-0082: what=questionnaire UI thin slice (`/questionnaires`, `/questionnaires/[questionnaireId]`) + typed ops `questionnaire.listAssigned|getDraft|saveDraft|submit` with rater-scoped access; where=local (`localhost:3111`) + Supabase beta pooler; how=`pnpm --filter @feedback-360/api-contract test`, `pnpm --filter @feedback-360/db test -- --runInBand`, `pnpm --filter @feedback-360/cli typecheck`, `pnpm --filter @feedback-360/cli test`, `pnpm --filter @feedback-360/web lint`, `pnpm --filter @feedback-360/web typecheck`, `pnpm --filter @feedback-360/web test`, `pnpm --filter @feedback-360/web build`, `PLAYWRIGHT_BASE_URL=http://localhost:3111 cd apps/web && node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0082-questionnaire-ui.spec.ts --workers=1 --reporter=line`; quality_gate=passed; acceptance_gate=passed (`S5`: inbox→structured draft save→submit, `S8`: ended read-only + `campaign_ended_readonly`); artifacts=`.memory-bank/evidence/EP-008/FT-0082/2026-03-06/step-01-questionnaire-inbox.png`, `.memory-bank/evidence/EP-008/FT-0082/2026-03-06/step-02-questionnaire-draft-saved.png`, `.memory-bank/evidence/EP-008/FT-0082/2026-03-06/step-03-questionnaire-submitted.png`, `.memory-bank/evidence/EP-008/FT-0082/2026-03-06/step-04-ended-readonly-view.png`; result=passed.
- FT-0083: what=results dashboards thin slice (`/results`, `/results/team`, `/results/hr`) + typed ops `results.getMyDashboard|getTeamDashboard|getHrView`; where=local + Supabase beta pooler; how=`pnpm --filter @feedback-360/web lint`, `pnpm --filter @feedback-360/web typecheck`, `set -a; source .env; set +a; pnpm --filter @feedback-360/web test`, `set -a; source .env; set +a; pnpm --filter @feedback-360/web build`, `set -a; source .env; set +a; cd apps/web && node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0083-results-ui.spec.ts`; quality_gate=passed; acceptance_gate=passed (`S9`: employee/manager dashboards hide raw comments, `hr_reader` dashboard hides raw, `hr_admin` dashboard shows raw+processed+summary); artifacts=`.memory-bank/evidence/EP-008/FT-0083/2026-03-05/step-01-employee-results-without-raw.png`, `.memory-bank/evidence/EP-008/FT-0083/2026-03-05/step-02-manager-results-without-raw.png`, `.memory-bank/evidence/EP-008/FT-0083/2026-03-05/step-03-hr-results-with-raw.png`; result=passed.
- FT-0084: what=HR campaign workbench thin UI (`/hr/campaigns`) + typed adapter `/api/hr/campaigns/execute` for campaign lifecycle/matrix/progress/AI retry; where=local + Supabase beta pooler; how=`set -a; source .env; set +a; pnpm --filter @feedback-360/web lint`, `set -a; source .env; set +a; pnpm --filter @feedback-360/web typecheck`, `set -a; source .env; set +a; pnpm --filter @feedback-360/web test`, `set -a; source .env; set +a; pnpm --filter @feedback-360/web build`, `set -a; source .env; set +a; cd apps/web && node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0084-hr-campaign-ui.spec.ts`; quality_gate=passed; acceptance_gate=passed (`S4`: HR create/start/matrix, `S5`: first draft-save lock with `campaign_locked`, `S8`: AI retry button runs `ai.runForCampaign`); artifacts=`.memory-bank/evidence/EP-008/FT-0084/2026-03-05/step-01-hr-campaign-start-and-matrix.png`, `.memory-bank/evidence/EP-008/FT-0084/2026-03-05/step-02-hr-campaign-locked.png`, `.memory-bank/evidence/EP-008/FT-0084/2026-03-05/step-03-hr-campaign-ai-retry.png`; result=passed.

## EP-009 Test & release hardening
- FT-0091
  - Must add test: stable DB integration lane rerun against the same environment without shared-state failures.
  - Must run: repeated DB integration suite + workspace `checks` equivalent.
- FT-0092
  - Must add test: PR/CI smoke proving required `checks` context exists and unblocks merge.
  - Must run: GitHub PR to `develop` with green required status and reproducible local command set.
- FT-0093
  - Must add test: browser smoke on `beta` for at least one auth flow and one domain flow.
  - Must run: deploy to `beta` + screenshot evidence.
- FT-0094
  - Must add test: docs audit / consistency check across FT/EP/index/verification matrix.
  - Must run: manual consistency sweep with zero status drift.

### EP-009 execution evidence (2026-03-05)
- FT-0091: what=DB integration isolation + deterministic seed replay; where=local + Supabase beta pooler; how=`pnpm test:db`, rerun `pnpm test:db`, `pnpm checks`, targeted `pnpm --filter @feedback-360/db exec vitest run --testTimeout=45000 --maxWorkers=1 --no-file-parallelism src/migrations/ft-0091-db-integration-isolation.test.ts`; quality_gate=passed; acceptance_gate=passed (DB lane green twice подряд, no duplicate/FK drift, seed replay deterministic, curated DB timeouts raised to 45s for cloud latency); ci_run=`https://github.com/deksden-com/feedback-360/actions/runs/22738344260`; result=passed.
- FT-0092: what=required GitHub `checks` topology + Vercel-ready PR surface; where=GitHub PR `#26` + local repro; how=`pnpm checks`, `gh pr checks 26`, `gh run list --workflow ci.yml --limit 3`; quality_gate=passed; acceptance_gate=passed (`checks` context exists, branch protection sees green status, PR no longer blocked by missing context); ci_run=`https://github.com/deksden-com/feedback-360/actions/runs/22738344260`; deploy=`https://go360go-beta-qjzyzd712-deksdens-projects.vercel.app`; result=passed.

## EP-010 Production readiness
- FT-0101
  - Must add test: `apps/web/playwright/tests/ft-0101-results-privacy.spec.ts`
  - Must run: role visibility on `beta` (`hr_reader` no raw, `hr_admin` raw+processed+summary) + policy/docs sync.
- FT-0102
  - Must add test: `apps/web/src/lib/observability.test.ts`, `apps/web/src/app/api/webhooks/ai/route.test.ts`, `apps/web/src/app/api/sentry-example-api/route.test.ts`
  - Must run: controlled backend error on `beta` + correlation headers + Sentry project visibility.
- FT-0103
  - Must add test: runbook drill evidence bundle (`health`, `vercel inspect`, browser login smoke).
  - Must run: beta recovery walkthrough from runbook without parallel seed-based checks.
- FT-0104
  - Must add test: release rehearsal evidence bundle (`CI`, `Beta Smoke`, browser smoke, deploy inspect).
  - Must run: full `develop -> beta` rehearsal once end-to-end.

### EP-010 execution evidence (2026-03-06)
- FT-0101: what=privacy policy finalization + hr_reader runtime shaping; where=local + beta; how=`pnpm --filter @feedback-360/db exec vitest run --testTimeout=45000 --maxWorkers=1 --no-file-parallelism src/migrations/ft-0003-seed-runner.test.ts src/migrations/ft-0091-db-integration-isolation.test.ts`, `pnpm --filter @feedback-360/core test -- ft-0055-results-views.test.ts ft-0073-processed-text-visibility.test.ts`, `pnpm --filter @feedback-360/web exec playwright test --config playwright/playwright.config.mjs tests/ft-0101-results-privacy.spec.ts`, `PLAYWRIGHT_BASE_URL=https://beta.go360go.ru pnpm --filter @feedback-360/web exec playwright test --config playwright/playwright.config.mjs tests/ft-0101-results-privacy.spec.ts`; quality_gate=passed (`db lint/typecheck`, `web lint/typecheck`, targeted core/web tests, build); acceptance_gate=passed (`hr_reader` redacted, `hr_admin` keeps raw on local and beta); browser_smoke=artifacts in `.memory-bank/evidence/EP-010/FT-0101/2026-03-06/`; result=passed.
- FT-0102: what=observability baseline with correlation ids and controlled error drill; where=local + beta + Sentry API; how=`pnpm --filter @feedback-360/web test -- src/lib/observability.test.ts src/app/api/webhooks/ai/route.test.ts src/app/api/sentry-example-api/route.test.ts`, `curl -isS https://beta.go360go.ru/api/sentry-example-api?...`, `curl -H \"Authorization: Bearer $SENTRY_AUTH_TOKEN\" https://sentry.io/api/0/projects/deksdencom/go360go-beta/events/`; quality_gate=passed (`web lint/typecheck/test/build`); acceptance_gate=passed (`500` returns `eventId`/`requestId`/correlation headers, beta Sentry project feed accessible and contains runtime events, runbook updated for stable confirmation path); artifacts=`.memory-bank/evidence/EP-010/FT-0102/2026-03-06/step-01-controlled-error.txt`, `.memory-bank/evidence/EP-010/FT-0102/2026-03-06/step-02-sentry-project-events.json`; result=passed.
- FT-0103: what=runbook recovery drill + serialized beta smoke guardrail; where=beta; how=`vercel inspect beta.go360go.ru`, `curl -isS https://beta.go360go.ru/api/health`, `curl -isS https://beta.go360go.ru/auth/login`, `$agent-browser`/`npx agent-browser` login + demo-mode screenshots; quality_gate=`N/A` (ops/docs closeout) plus `docs:audit` after sync; acceptance_gate=passed (beta alias healthy, runbook executable, shared-beta-DB rule documented, browser login smoke green); browser_smoke=login screenshot + select-company screenshot; deploy=`https://go360go-beta-19am2wu86-deksdens-projects.vercel.app`; result=passed.
- FT-0104: what=beta-first release rehearsal; where=GitHub Actions + Vercel + beta; how=`gh run list --workflow ci.yml --branch develop --limit 1`, `gh api repos/deksden-com/feedback-360/commits/41e03a454ff16b3f567bf53bf23975097ce358a5/check-runs`, `gh run view 22752569106`, `PLAYWRIGHT_BASE_URL=https://beta.go360go.ru pnpm --filter @feedback-360/web test:smoke:beta`, browser demo-login smoke; quality_gate=passed (merge commit CI green, docs audit green); acceptance_gate=passed (develop deploy ready, manual rerun of Beta Smoke green after serialization, browser smoke green, release checklist reproducible); ci_run=`https://github.com/deksden-com/feedback-360/actions/runs/22752471756`; deploy=`https://go360go-beta-19am2wu86-deksdens-projects.vercel.app`; browser_smoke=select-company screenshot in `.memory-bank/evidence/EP-010/FT-0104/2026-03-06/`; result=passed.
- FT-0093: what=beta smoke release gates + manual browser evidence; where=real `https://beta.go360go.ru`; how=`PLAYWRIGHT_BASE_URL=https://beta.go360go.ru pnpm --filter @feedback-360/web test:smoke:beta`, manual `$agent-browser` login→demo→select-company flow; quality_gate=passed; acceptance_gate=passed (5 smoke specs green on beta, manual screenshots captured, workflow dispatch green on updated SHA); browser_smoke=passed; ci_run=`https://github.com/deksden-com/feedback-360/actions/runs/22738351836`; artifacts=`.memory-bank/evidence/EP-009/FT-0093/2026-03-05/step-01-beta-login.png`, `.memory-bank/evidence/EP-009/FT-0093/2026-03-05/step-02-beta-select-company.png`; result=passed.
- FT-0094: what=docs/evidence sync + epic progress audit; where=local; how=`pnpm docs:audit`, `rg -n "Status: Draft|Status: In Progress" .memory-bank/plans/epics/EP-009-test-release-hardening`; quality_gate=passed; acceptance_gate=passed (EP counts match feature docs, completed FT all have evidence blocks, verification matrix section present); result=passed.

## EP-010 Production readiness
- FT-0101
  - Must add test: docs consistency check between retention/privacy, RBAC, results visibility and glossary.
  - Must run: resolved policy review with no open retention ambiguity.
- FT-0102
  - Must add test: controlled runtime error + webhook/cron trace validation on `beta`.
  - Must run: Sentry/logs smoke with correlation ids.
- FT-0103
  - Must add test: runbook drill checklist with health verification after recovery walkthrough.
  - Must run: recovery/release drill on `beta`.
- FT-0104
  - Must add test: release rehearsal checklist with CI/deploy/smoke evidence bundle.
  - Must run: one end-to-end rehearsal before `prod` promotion.

## EP-011 App shell and navigation
- FT-0111
  - Must add test: `apps/web/playwright/tests/ft-0111-app-shell.spec.ts`
  - Must run: login -> company select -> internal nav traversal under shared shell.
- FT-0112
  - Must add test: `apps/web/playwright/tests/ft-0112-role-home-dashboards.spec.ts`
  - Must run: employee/manager/hr_admin role-aware home dashboards from seeded states.
- FT-0113
  - Must add test: `apps/web/playwright/tests/ft-0113-shared-states.spec.ts`
  - Must run: empty/loading/error states on local + one browser-smoke on `beta`.

### EP-011 execution evidence
- FT-0111: what=internal app shell + role-aware navigation across existing internal routes; where=local; how=`pnpm --filter @feedback-360/web lint`, `pnpm --filter @feedback-360/web typecheck`, `pnpm --filter @feedback-360/web test`, `pnpm --filter @feedback-360/web build`, `cd apps/web && node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0111-app-shell.spec.ts --reporter=line`; quality_gate=passed; acceptance_gate=passed (`S7_campaign_started_some_submitted`: employee home/questionnaires shell, manager team-results nav, HR campaigns nav, company context preserved); artifacts=`.memory-bank/evidence/EP-011/FT-0111/2026-03-06/step-01-employee-home-shell.png`, `.memory-bank/evidence/EP-011/FT-0111/2026-03-06/step-02-questionnaires-shell.png`, `.memory-bank/evidence/EP-011/FT-0111/2026-03-06/step-03-manager-team-results-shell.png`, `.memory-bank/evidence/EP-011/FT-0111/2026-03-06/step-04-hr-campaigns-shell.png`; result=passed.
- FT-0112: what=role-aware home dashboards for employee/manager/HR; where=local (dedicated Next dev server on `127.0.0.1:3101` to avoid seed collisions in shared webServer mode); how=`pnpm --filter @feedback-360/web lint`, `pnpm --filter @feedback-360/web typecheck`, `pnpm --filter @feedback-360/web test`, `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3101 cd apps/web && node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0111-app-shell.spec.ts tests/ft-0112-role-home-dashboards.spec.ts --workers=1 --reporter=line`; quality_gate=passed (`lint/typecheck/test`), build re-run kept separate from active dev server; acceptance_gate=passed (`2 passed`, employee→questionnaires, manager→results/team, hr_admin→hr/campaigns); artifacts=`.memory-bank/evidence/EP-011/FT-0112/2026-03-06/step-01-employee-home-dashboard.png`, `.memory-bank/evidence/EP-011/FT-0112/2026-03-06/step-02-manager-home-dashboard.png`, `.memory-bank/evidence/EP-011/FT-0112/2026-03-06/step-03-hr-home-dashboard.png`; result=passed.
- FT-0113: what=shared loading/empty/error states for internal pages with friendly copy and reusable page-state components; where=local (dedicated Next dev server on `127.0.0.1:3101`) + beta manual verification path; how=`pnpm --filter @feedback-360/web lint`, `pnpm --filter @feedback-360/web typecheck`, `pnpm --filter @feedback-360/web test`, `pnpm --filter @feedback-360/web build`, `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3101 cd apps/web && node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0113-shared-states.spec.ts --workers=1 --reporter=line`; quality_gate=passed; acceptance_gate=passed (`3 passed`: questionnaires empty CTA, results friendly error without backend leak, delayed navigation loading state); artifacts=`.memory-bank/evidence/EP-011/FT-0113/2026-03-06/step-01-questionnaires-empty-state.png`, `.memory-bank/evidence/EP-011/FT-0113/2026-03-06/step-02-results-error-state.png`, `.memory-bank/evidence/EP-011/FT-0113/2026-03-06/step-03-shared-loading-state.png`; result=passed.

## EP-012 HR campaigns UX
- FT-0121
  - Must add test: `apps/web/playwright/tests/ft-0121-campaign-list.spec.ts`
  - Must run: HR list/filter/open campaign flow on local + `beta`.
- FT-0122
  - Must add test: `apps/web/playwright/tests/ft-0122-campaign-draft-config.spec.ts`
  - Must run: create/edit draft campaign flow with validation and persistence.
- FT-0123
  - Must add test: `apps/web/playwright/tests/ft-0123-campaign-detail-dashboard.spec.ts`
  - Must run: start -> progress -> lock banner -> AI retry surface.

### EP-012 execution evidence
- FT-0121: what=HR campaigns list with status counters, filters and deep link to detail page; where=local (dedicated Next dev server on `localhost:3101` to keep cookies stable for form/navigation flows); how=`pnpm checks`, `PLAYWRIGHT_BASE_URL=http://localhost:3101 cd apps/web && node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0121-campaign-list.spec.ts --workers=1 --reporter=line`; quality_gate=passed; acceptance_gate=passed (`S4_campaign_draft` + additional started/completed campaigns created via execute API, filters deterministic, detail opens in active company context); artifacts=`.memory-bank/evidence/EP-012/FT-0121/2026-03-06/step-01-campaign-list-overview.png`, `.memory-bank/evidence/EP-012/FT-0121/2026-03-06/step-02-campaign-list-filtered.png`, `.memory-bank/evidence/EP-012/FT-0121/2026-03-06/step-03-campaign-detail-from-list.png`; result=passed.
- FT-0122: what=create/edit draft campaign flow with typed draft route and persisted config reopen; where=local (`localhost:3101`); how=`pnpm checks`, `PLAYWRIGHT_BASE_URL=http://localhost:3101 cd apps/web && node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0122-campaign-draft-config.spec.ts --workers=1 --reporter=line`; quality_gate=passed; acceptance_gate=passed (`S4_campaign_draft` includes published model, create form saves draft, redirect flash shown, edit route restores timezone/dates/weights); artifacts=`.memory-bank/evidence/EP-012/FT-0122/2026-03-06/step-01-draft-create-form.png`, `.memory-bank/evidence/EP-012/FT-0122/2026-03-06/step-02-draft-edit-reopen.png`; result=passed.
- FT-0123: what=campaign detail dashboard with progress, lock banner and AI retry surface; where=local (`localhost:3101`); how=`pnpm checks`, `PLAYWRIGHT_BASE_URL=http://localhost:3101 cd apps/web && node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0123-campaign-detail-dashboard.spec.ts --workers=1 --reporter=line`; quality_gate=passed; acceptance_gate=passed (`S4_campaign_draft` start flow, `S5_campaign_started_no_answers` lock after first draft save, `S8_campaign_ended` AI retry via MVP stub); artifacts=`.memory-bank/evidence/EP-012/FT-0123/2026-03-06/step-01-detail-started.png`, `.memory-bank/evidence/EP-012/FT-0123/2026-03-06/step-02-detail-locked.png`, `.memory-bank/evidence/EP-012/FT-0123/2026-03-06/step-03-detail-ai-retry.png`; result=passed.

## EP-013 Questionnaire experience
- FT-0131
  - Must add test: `apps/web/playwright/tests/ft-0131-questionnaire-inbox.spec.ts`
  - Must run: questionnaire inbox filters and resume-draft flow.
- FT-0132
  - Must add test: `apps/web/playwright/tests/ft-0132-questionnaire-fill-flow.spec.ts`
  - Must run: fill -> save draft -> reload -> submit.
- FT-0133
  - Must add test: `apps/web/playwright/tests/ft-0133-questionnaire-readonly.spec.ts`
  - Must run: submitted + ended read-only behavior on local and `beta`.

### EP-013 execution evidence
- FT-0131: what=questionnaire inbox with counters, filters and resume-draft CTA; where=local (`localhost:3111`); how=`pnpm --filter @feedback-360/api-contract test`, `pnpm --filter @feedback-360/db test -- --runInBand`, `pnpm --filter @feedback-360/web lint`, `pnpm --filter @feedback-360/web typecheck`, `pnpm --filter @feedback-360/web test`, `pnpm --filter @feedback-360/web build`, `PLAYWRIGHT_BASE_URL=http://localhost:3111 cd apps/web && node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0131-questionnaire-inbox.spec.ts --workers=1 --reporter=line`; quality_gate=passed; acceptance_gate=passed (`S7_campaign_started_some_submitted`: counters, filters, resume flow); artifacts=`.memory-bank/evidence/EP-013/FT-0131/2026-03-06/step-01-inbox-all-statuses.png`, `.memory-bank/evidence/EP-013/FT-0131/2026-03-06/step-02-inbox-filtered-drafts.png`, `.memory-bank/evidence/EP-013/FT-0131/2026-03-06/step-03-resume-draft.png`; result=passed.
- FT-0132: what=structured questionnaire form with progress, draft restore/save and submit; where=local (`localhost:3111`); how=`pnpm --filter @feedback-360/api-contract test`, `pnpm --filter @feedback-360/db test -- --runInBand`, `pnpm --filter @feedback-360/cli typecheck`, `pnpm --filter @feedback-360/cli test`, `pnpm --filter @feedback-360/web lint`, `pnpm --filter @feedback-360/web typecheck`, `pnpm --filter @feedback-360/web test`, `pnpm --filter @feedback-360/web build`, `PLAYWRIGHT_BASE_URL=http://localhost:3111 cd apps/web && node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0132-questionnaire-fill-flow.spec.ts --workers=1 --reporter=line`; quality_gate=passed; acceptance_gate=passed (`S6_campaign_started_some_drafts`: restore draft, progress `4/4`, submit success banner); artifacts=`.memory-bank/evidence/EP-013/FT-0132/2026-03-06/step-01-draft-restored-and-saved.png`, `.memory-bank/evidence/EP-013/FT-0132/2026-03-06/step-02-questionnaire-submitted.png`; result=passed.
- FT-0133: what=explicit read-only and re-entry states for submitted/ended questionnaires; where=local (`localhost:3111`); how=`pnpm --filter @feedback-360/db test -- --runInBand`, `pnpm --filter @feedback-360/web lint`, `pnpm --filter @feedback-360/web typecheck`, `pnpm --filter @feedback-360/web test`, `pnpm --filter @feedback-360/web build`, `PLAYWRIGHT_BASE_URL=http://localhost:3111 cd apps/web && node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0133-questionnaire-readonly.spec.ts --workers=1 --reporter=line`; quality_gate=passed; acceptance_gate=passed (`S7_campaign_started_some_submitted`: submitted readonly, `S8_campaign_ended`: UI readonly + backend `409 campaign_ended_readonly`); artifacts=`.memory-bank/evidence/EP-013/FT-0133/2026-03-06/step-01-submitted-readonly.png`, `.memory-bank/evidence/EP-013/FT-0133/2026-03-06/step-02-ended-readonly.png`; result=passed.
- EP-013 beta release gate: what=beta smoke stabilization for questionnaire/results/select-company/HR campaign surfaces after EP-013 merge; where=real `https://beta.go360go.ru`; how=`pnpm --filter @feedback-360/web lint`, `pnpm --filter @feedback-360/web typecheck`, `PLAYWRIGHT_BASE_URL=https://beta.go360go.ru pnpm --filter @feedback-360/web exec playwright test --config playwright/playwright.config.mjs tests/smoke --workers=1 --reporter=line`; quality_gate=passed; acceptance_gate=passed (5 smoke specs green on beta with runner-local seeding and isolated browser sessions); ci_run=`https://github.com/deksden-com/feedback-360/actions/runs/22766395163`; beta_smoke_run=`https://github.com/deksden-com/feedback-360/actions/runs/22766395166`; result=passed.

## EP-014 Feature-area slice refactor
- FT-0141
  - Must add test: `packages/core/src/ft/ft-0141-feature-area-target-structure.test.ts`
  - Must run: feature-area map + shared-module policy audit + stale numbering/path scan + `pnpm docs:audit`.
- FT-0142
  - Must add test: `packages/core/src/ft/ft-0142-feature-area-regression.test.ts`
  - Must add test: `packages/client/src/ft-0142-feature-area-client-regression.test.ts`
  - Must add test: `packages/cli/src/ft-0142-feature-area-cli-regression.test.ts`
  - Must run: representative campaigns/questionnaires/results/notifications/ai flows before/after extraction with stable DTO/error parity.
- FT-0143
  - Must add test: `apps/web/playwright/tests/ft-0143-slice-refactor-regression.spec.ts`
  - Must run: login/company switch -> HR campaigns -> questionnaire -> results smoke on local and `beta`, plus `build` and deploy proof.

### EP-014 execution evidence
- FT-0141: what=feature-area target map, shared-module policy and thin-root rules fixed in SSoT; where=docs + structure audit; how=`pnpm --filter @feedback-360/core test -- --runInBand src/ft/ft-0141-feature-area-target-structure.test.ts`, `pnpm docs:audit`, `rg -n "src/slices|commands/<slice>|v1/<slice>|packages/core/src/slices|packages/cli/src/commands" .memory-bank packages apps/web`; quality_gate=passed; acceptance_gate=passed; result=passed.
- FT-0142: what=core/api-contract/client/cli moved to explicit feature-area surfaces with thin roots; where=workspace packages; how=`pnpm checks`, `pnpm --filter @feedback-360/api-contract test`, `pnpm --filter @feedback-360/client test`, `pnpm --filter @feedback-360/cli test`; quality_gate=passed; acceptance_gate=passed; result=passed.
- FT-0143: what=web/lib feature-area realignment, docs sync and route regression proof; where=local workspace + `beta`; how=`pnpm checks`, `pnpm docs:audit`, `cd apps/web && node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0143-slice-refactor-regression.spec.ts --workers=1 --reporter=line`, beta smoke/browser proof after deploy; quality_gate=passed; acceptance_gate=passed locally, beta=planned until deploy; artifacts=`.memory-bank/evidence/EP-014/FT-0143/2026-03-06/`; result=in_progress.

## EP-015 Results experience
- FT-0151
  - Must add test: `apps/web/playwright/tests/ft-0151-employee-results-dashboard.spec.ts`
  - Must run: employee completed-results dashboard without raw comments.
- FT-0152
  - Must add test: `apps/web/playwright/tests/ft-0152-manager-results-dashboard.spec.ts`
  - Must run: manager team results with anonymity/hide-merge behavior.
- FT-0153
  - Must add test: `apps/web/playwright/tests/ft-0153-hr-results-workbench.spec.ts`
  - Must run: `hr_admin` vs `hr_reader` visibility comparison with processed/raw shaping.

### EP-015 execution evidence
- Planned: evidence будет добавлено после реализации FT-0151..FT-0153.

## EP-016 People and org admin
- FT-0161
  - Must add test: `apps/web/playwright/tests/ft-0161-employee-directory.spec.ts`
  - Must run: employee search/filter/open profile flow.
- FT-0162
  - Must add test: `apps/web/playwright/tests/ft-0162-employee-profile.spec.ts`
  - Must run: create employee + provision/update user email and role.
- FT-0163
  - Must add test: `apps/web/playwright/tests/ft-0163-org-editor.spec.ts`
  - Must run: create/update department + move employee + history check.

### EP-016 execution evidence
- Planned: evidence будет добавлено после реализации FT-0161..FT-0163.

## EP-017 Competency models and matrix UI
- FT-0171
  - Must add test: `apps/web/playwright/tests/ft-0171-model-catalog.spec.ts`
  - Must run: model list/filter/clone draft flow.
- FT-0172
  - Must add test: `apps/web/playwright/tests/ft-0172-model-editor.spec.ts`
  - Must run: edit model draft, validate structure/weights, publish version.
- FT-0173
  - Must add test: `apps/web/playwright/tests/ft-0173-matrix-builder.spec.ts`
  - Must run: autogenerate matrix -> manual edit -> lock preview/lock state.

### EP-017 execution evidence
- Planned: evidence будет добавлено после реализации FT-0171..FT-0173.

## EP-018 Notification center UI
- FT-0181
  - Must add test: `apps/web/playwright/tests/ft-0181-reminder-schedule-editor.spec.ts`
  - Must run: reminder schedule edit with timezone/quiet-hours preview.
- FT-0182
  - Must add test: `apps/web/playwright/tests/ft-0182-template-catalog.spec.ts`
  - Must run: template preview and variable inspection flow.
- FT-0183
  - Must add test: `apps/web/playwright/tests/ft-0183-delivery-diagnostics.spec.ts`
  - Must run: outbox/delivery diagnostics filters and failed-attempt drill-down.

### EP-018 execution evidence
- Planned: evidence будет добавлено после реализации FT-0181..FT-0183.

## EP-019 Admin and ops UI
- FT-0191
  - Must add test: `apps/web/playwright/tests/ft-0191-health-release-dashboard.spec.ts`
  - Must run: health/build/smoke indicators against mocked local data + `beta` browser-smoke.
- FT-0192
  - Must add test: `apps/web/playwright/tests/ft-0192-ai-diagnostics.spec.ts`
  - Must run: AI job/webhook diagnostics with idempotency markers.
- FT-0193
  - Must add test: `apps/web/playwright/tests/ft-0193-audit-console.spec.ts`
  - Must run: audit trail filters by campaign/actor/action and release-event traceability.

### EP-019 execution evidence
- Planned: evidence будет добавлено после реализации FT-0191..FT-0193.
