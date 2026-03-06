# Epics (draft list)
Status: Draft (2026-03-03)

Каждая фича описывается по шаблону `feature-template.md` и включает автопроверяемый сценарий.

## Epic 0 — Foundation
- Repo scaffold (pnpm monorepo), Biome, Vitest, Playwright, CI skeleton
- Supabase local/dev + Drizzle migrations
- Seed scenarios (стандартные состояния БД)
  - Детали: [EP-000 Feature catalog](epics/EP-000-foundation/features/index.md) — что именно делаем и как проверяем. Читать, чтобы foundation закрывался автосценариями.

## Epic 1 — Core + Contract + Client + CLI-first
- Core use-cases + policies ports/adapters
- Typed contract v1
- Typed client (http + in-proc optional)
- CLI commands (seed, company, employee, campaign)
  - Детали: [EP-001 Feature catalog](epics/EP-001-core-contract-client-cli/features/index.md) — фичи с acceptance сценариями. Читать, чтобы контракт/CLI были 1:1 и тестируемы.

## Epic 2 — Tenancy + RBAC + Auth model
- companies/memberships/employees/users linking
- access checks + RLS skeleton
  - Детали: [EP-002 Feature catalog](epics/EP-002-identity-tenancy-rbac/features/index.md) — фичи с acceptance сценариями. Читать, чтобы multi-tenant был безопасен.

## Epic 3 — Org structure + snapshots
- departments, reporting lines, history
- snapshot on campaign start
  - Детали: [EP-003 Feature catalog](epics/EP-003-org-snapshots/features/index.md) — фичи с acceptance сценариями. Читать, чтобы матрица и история были консистентны.

## Epic 4 — Competency models
- model versions (indicators MVP)
- levels model (next)
  - Детали: [EP-004 Feature catalog](epics/EP-004-campaigns-questionnaires/features/index.md) — фичи с acceptance сценариями (models/campaigns/questionnaires). Читать, чтобы GS1/GS5/GS6 были реализуемы.

## Epic 5 — Campaign lifecycle + assignments
- create/start/end/stop
- auto-generate matrix from org snapshot + manual edit
- freeze on first draft save
  - Детали: [EP-004 Feature catalog](epics/EP-004-campaigns-questionnaires/features/index.md) — lifecycle+lock. Читать, чтобы запреты были тестируемы.

## Epic 6 — Questionnaires
- draft/save/submit
- read-only after end
  - Детали: [FT-0013 Questionnaire ops](epics/EP-001-core-contract-client-cli/features/FT-0013-questionnaire-ops-cli/index.md) — операции и сценарии. Читать, чтобы CLI/UI не расходились.

## Epic 7 — Results
- calculations + distributions
- anonymity rules + merge/hide
- weight normalization
  - Детали: [EP-005 Feature catalog](epics/EP-005-results-anonymity/features/index.md) — расчёты/анонимность/веса с acceptance сценариями. Читать, чтобы результаты соответствовали best practices.

## Epic 8 — Notifications
- outbox + resend provider
- invite + reminders + schedules
  - Детали: [EP-006 Feature catalog](epics/EP-006-notifications-outbox/features/index.md) — outbox/идемпотентность/таймзоны. Читать, чтобы не было дублей и спама.

## Epic 9 — AI processing
- ai_jobs + webhook (HMAC + idempotency)
- processed text aggregates
- HR retry button
  - Детали: [EP-007 Feature catalog](epics/EP-007-ai-webhooks/features/index.md) — AI job/webhook/processed aggregates. Читать, чтобы GS3 был закрыт.

## Epic 10 — Minimal UI
- HR create campaign + monitor
- employee fill questionnaires + view dashboard
- manager view (team)
  - Детали: [EP-008 Feature catalog](epics/EP-008-ui-minimal/features/index.md) — UI фичи и e2e сценарии. Читать, чтобы UI оставался thin.

## Epic 11 — Test & release hardening
- DB integration isolation
- CI checks topology / merge gate stabilization
- beta smoke release gates
- docs/evidence sync
  - Детали: [EP-009 Feature catalog](epics/EP-009-test-release-hardening/features/index.md) — hardening фичи с acceptance сценариями. Читать, чтобы после MVP разработка и релизы были стабильными.

## Epic 12 — Production readiness
- retention/privacy finalization
- observability baseline
- runbook and recovery drill
- release rehearsal
  - Детали: [EP-010 Feature catalog](epics/EP-010-prod-readiness/features/index.md) — эксплуатационная готовность с проверяемыми deliverables. Читать, чтобы перейти от MVP к production-grade процессу.

## Epic 13 — GUI foundation: App shell and navigation
- internal app shell
- role-aware home dashboards
- shared loading/empty/error states
  - Детали: [EP-011 Feature catalog](epics/EP-011-app-shell-navigation/features/index.md) — foundation для следующих GUI-эпиков с локальными и beta сценариями. Читать, чтобы UI развивался как продукт, а не набор отдельных страниц.

## Epic 14 — HR campaigns UX
- campaigns list and filters
- campaign create/edit draft flow
- campaign detail dashboard and daily operations
  - Детали: [EP-012 Feature catalog](epics/EP-012-hr-campaigns-ux/features/index.md) — HR end-to-end путь от draft до monitoring. Читать, чтобы главный HR surface был целостным и проверяемым.

## Epic 15 — Questionnaire experience
- questionnaire inbox
- structured fill flow
- read-only and re-entry states
  - Детали: [EP-013 Feature catalog](epics/EP-013-questionnaire-experience/features/index.md) — user-level сценарии оценивания от inbox до submit/read-only. Читать, чтобы UX опирался на уже работающие questionnaire ops.

## Epic 16 — Results experience
- employee results dashboard
- manager team results dashboard
- HR results workbench
  - Детали: [EP-014 Feature catalog](epics/EP-014-results-experience/features/index.md) — role-aware reporting surfaces с privacy/anonymity constraints. Читать, чтобы визуализация не нарушила доменные правила.

## Epic 17 — People and org admin
- employee directory
- employee profile and account provisioning
- department tree and org editor
  - Детали: [EP-015 Feature catalog](epics/EP-015-people-org-admin/features/index.md) — HR-admin GUI для employees и org structure. Читать, чтобы справочник и оргданные поддерживались без CLI.

## Epic 18 — Competency models and matrix UI
- model catalog and version hub
- model editor
- matrix builder with freeze preview
  - Детали: [EP-016 Feature catalog](epics/EP-016-models-matrix-ui/features/index.md) — GUI для содержательной настройки 360 и assignments. Читать, чтобы models/matrix не оставались только “backend capability”.

## Epic 19 — Notification center UI
- reminder schedule editor
- template catalog and preview
- delivery diagnostics and outbox view
  - Детали: [EP-017 Feature catalog](epics/EP-017-notification-center-ui/features/index.md) — визуальный контроль уведомлений и доставок. Читать, чтобы HR/Admin мог управлять reminders через GUI.

## Epic 20 — Admin and ops UI
- health and release dashboard
- AI jobs and webhook diagnostics
- audit trail and release console
  - Детали: [EP-018 Feature catalog](epics/EP-018-admin-ops-ui/features/index.md) — эксплуатационный GUI для beta/prod. Читать, чтобы команда видела состояние системы без ручного похода в разные панели.
