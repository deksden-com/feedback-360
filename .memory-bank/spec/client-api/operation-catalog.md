# Operation catalog (v1) — draft
Status: Draft (2026-03-03)

Цель: единый список операций typed client API, который:
- вызывает CLI,
- вызывает UI,
- покрывают тестовые сценарии (GS*) и seeds.

Формат (черновик):
- `op`: имя операции
- `roles`: кто может вызывать (RBAC)
- `idempotent`: да/нет (нужно ли `idempotency_key`)
- `cli`: какая команда CLI маппится

## Seed / devops
- `seed.run`
  - roles: hr_admin (dev), service role (tests)
  - idempotent: no (обычно reset+apply)
  - cli: `seed --scenario ... [--variant ...]`

## Client-local context (no network)
- `client.setActiveCompany`
  - roles: any authenticated (has membership)
  - idempotent: yes
  - cli: `company use`

## Company / memberships
- `company.create`
  - roles: hr_admin
  - idempotent: optional
  - cli: `company create`
- `membership.list`
  - roles: any authenticated
  - idempotent: yes
  - cli: (future) `membership list`

## Employees / org
- `employee.upsert`
  - roles: hr_admin
  - idempotent: yes (by natural key)
  - cli: `employee upsert`
- `employee.directoryList`
  - roles: hr_admin, hr_reader
  - idempotent: yes
  - output: employee directory rows with department, status, linked-user marker and search/filter metadata
  - cli: (future) `employee directory`
- `employee.profileGet`
  - roles: hr_admin, hr_reader
  - idempotent: yes
  - output: employee summary + department/manager/position history + provisioning snapshot
  - cli: (future) `employee profile`
- `employee.listActive`
  - roles: hr_admin, hr_reader
  - idempotent: yes
  - cli: `employee list-active`
- `identity.provisionAccess`
  - roles: hr_admin
  - idempotent: yes
  - output: ensured `user` + membership/account linkage for employee email inside active company
  - cli: (future) `identity provision-access`
- `department.list`
  - roles: hr_admin, hr_reader
  - idempotent: yes
  - output: department tree/list with current members snapshot for active company
  - cli: (future) `org department list`
- `department.upsert`
  - roles: hr_admin
  - idempotent: yes
  - cli: (future) `org department upsert`
- `org.department.create`
  - roles: hr_admin
  - idempotent: optional
  - cli: `org department create`
- `org.department.move`
  - roles: hr_admin
  - idempotent: yes
  - cli: `org department move`
- `org.manager.set`
  - roles: hr_admin
  - idempotent: yes
  - cli: `org set-manager`

## Competency models
- `model.version.create`
  - roles: hr_admin
  - idempotent: optional
  - cli: `model version create --kind ...`
- `model.version.get`
  - roles: hr_admin/hr_reader
  - idempotent: yes
  - cli: `model version get <model_version_id>`
- `model.version.cloneDraft`
  - roles: hr_admin
  - idempotent: optional
  - cli: `model version clone-draft <model_version_id>`
- `model.version.list`
  - roles: hr_admin/hr_reader
  - idempotent: yes
  - cli: `model version list`
- `model.version.upsertDraft`
  - roles: hr_admin
  - idempotent: yes
  - cli: `model version save-draft --payload-json ...`
- `model.version.publish`
  - roles: hr_admin
  - idempotent: yes
  - cli: `model version publish <model_version_id>`

## Campaigns
- `campaign.create`
  - roles: hr_admin
  - idempotent: optional
  - cli: `campaign create`
- `campaign.list`
  - roles: hr_admin/hr_reader
  - idempotent: yes
  - cli: `campaign list`
- `campaign.get`
  - roles: hr_admin/hr_reader
  - idempotent: yes
  - cli: `campaign get`
- `campaign.updateDraft`
  - roles: hr_admin
  - idempotent: yes
  - constraint: только `draft`, базовая config меняется через authoritative backend validation.
  - cli: `campaign update-draft`
- `campaign.setModelVersion`
  - roles: hr_admin
  - idempotent: yes
  - cli: `campaign set-model`
- `campaign.participants.add`
  - roles: hr_admin
  - idempotent: yes
  - cli: `campaign participants add`
- `campaign.participants.remove`
  - roles: hr_admin

## Matrix
- `matrix.generateSuggested`
  - roles: hr_admin
  - idempotent: yes
  - cli: `matrix generate <campaign_id>`
- `matrix.list`
  - roles: hr_admin/hr_reader
  - idempotent: yes
  - cli: `matrix list <campaign_id>`
- `matrix.set`
  - roles: hr_admin
  - idempotent: yes
  - cli: `matrix set <campaign_id> --assignments-json ...`
  - idempotent: yes
  - cli: `campaign participants remove`
- `campaign.participants.addFromDepartments`
  - roles: hr_admin
  - idempotent: yes
  - cli: `campaign participants add-departments`
- `campaign.weights.set`
  - roles: hr_admin
  - idempotent: yes
  - cli: `campaign weights set`
- `campaign.start`
  - roles: hr_admin
  - idempotent: yes (transition)
  - side effect: enqueue `campaign_invite` outbox rows for active campaign participants/assignments recipients (idempotent by outbox key)
  - cli: `campaign start`
- `campaign.stop`
  - roles: hr_admin
  - idempotent: yes
  - cli: `campaign stop`
- `campaign.end`
  - roles: hr_admin / service role (cron)
  - idempotent: yes
  - cli: `campaign end`
- `campaign.progress.get`
  - roles: hr_admin/hr_reader
  - idempotent: yes
  - output: `totalQuestionnaires`, `statusCounts`, `pendingQuestionnaires`, `pendingByRater`, `pendingBySubject`
  - cli: `campaign progress`
- `campaign.snapshot.list`
  - roles: hr_admin/hr_reader
  - idempotent: yes
  - cli: `campaign snapshot list`

## Matrix / assignments
- `matrix.generateSuggested`
  - roles: hr_admin
  - idempotent: yes (same snapshot → same suggestion)
  - cli: `matrix generate`
- `matrix.set`
  - roles: hr_admin
  - idempotent: optional
  - cli: `matrix set`

## Questionnaires
- `questionnaire.listAssigned`
  - roles: employee/manager/hr_*
  - idempotent: yes
  - scope:
    - `employee/manager`: только анкеты, где текущий `userId` связан с `rater_employee_id` в active company;
    - `hr_admin/hr_reader`: все анкеты active company.
  - `campaignId` optional: можно получить все назначенные анкеты active company.
  - cli: `questionnaire list`
- `questionnaire.getDraft`
  - roles: employee/manager/hr_*
  - idempotent: yes
  - scope:
    - `employee/manager`: только своя анкета (`rater_employee_id` текущего user);
    - `hr_admin/hr_reader`: доступ ко всем анкетам active company.
  - output: campaign metadata + snapshot subject display fields + resolved questionnaire definition (`groups/competencies/indicators|levels`).
  - cli: `questionnaire get`
- `questionnaire.saveDraft`
  - roles: employee/manager/hr_admin
  - idempotent: yes (by questionnaire+item)
  - scope:
    - `employee/manager`: можно сохранять только свою анкету;
    - `hr_admin`: может сохранять любую анкету active company.
  - cli: `questionnaire save-draft`
- `questionnaire.submit`
  - roles: employee/manager/hr_admin
  - idempotent: yes (transition)
  - scope:
    - `employee/manager`: можно submit только свою анкету;
    - `hr_admin`: может submit любую анкету active company.
  - cli: `questionnaire submit`

## Results
- `results.getMyDashboard`
  - roles: employee/manager/hr_*
  - idempotent: yes
  - cli: `results my`
- `results.getTeamDashboard`
  - roles: manager
  - idempotent: yes
  - cli: `results team`
- `results.getHrView`
  - roles: hr_admin/hr_reader
  - idempotent: yes
  - input options: `smallGroupPolicy=hide|merge_to_other` (optional), `anonymityThreshold` (optional, default 3)
  - output includes: `groupVisibility` + per-competency visibility flags (`peersVisibility/subordinatesVisibility/otherVisibility`)
  - output includes: `configuredGroupWeights`, `effectiveGroupWeights`, `overallScore`
  - output for `modelKind=levels` includes per-competency `*Levels` summaries (`modeLevel`, `distribution`, `nValid`, `nUnsure`)
  - privacy note: `hr_admin` получает raw + processed + summary open text; `hr_reader` получает только processed + summary
  - cli: `results hr`

## Notifications
- `notifications.settings.get`
  - roles: hr_admin/hr_reader
  - idempotent: yes
  - output: effective reminder settings for active company (`scheduledHour`, `weekdays`, `quietHours`, timezone context)
  - cli: `reminders settings`
- `notifications.settings.upsert`
  - roles: hr_admin
  - idempotent: yes
  - cli: `reminders configure`
- `notifications.settings.preview`
  - roles: hr_admin/hr_reader
  - idempotent: yes
  - output: timezone-aware next reminder slots for current settings or explicit preview payload
  - cli: `reminders preview`
- `notifications.templates.list`
  - roles: hr_admin/hr_reader
  - idempotent: yes
  - output: catalog rows with `templateKey`, locale, version, supported placeholders
  - cli: `notifications templates`
- `notifications.templates.preview`
  - roles: hr_admin/hr_reader
  - idempotent: yes
  - output: canonical preview payload (`subject`, `text`, `html`, `variables`)
  - cli: `notifications template-preview`
- `notifications.deliveries.list`
  - roles: hr_admin/hr_reader
  - idempotent: yes
  - output: delivery diagnostics rows with attempts, retry markers and recipient/campaign context
  - cli: `notifications deliveries`
- `notifications.generateReminders`
  - roles: hr_admin (MVP via core dispatcher)
  - idempotent: yes (by idempotency key)
  - input options: `campaignId`, `now?` (ISO timestamp override for deterministic checks/scheduler tests)
  - cli: `reminders generate`
- `notifications.dispatchOutbox`
  - roles: hr_admin (MVP via core dispatcher)
  - idempotent: yes
  - input options: `campaignId?`, `limit?`, `provider=stub|resend`
  - cli: `notifications dispatch`

## AI
- `ai.runForCampaign`
  - roles: hr_admin
  - idempotent: yes (per campaign, unless explicit retry)
  - cli: `ai run`
  - MVP behavior: `mvp_stub` synchronous completion (no external HTTP/webhook), campaign ends in `completed`.
- `ai.webhook.receive`
  - roles: service role only (endpoint)
  - idempotent: yes (by webhook receipt)
  - cli: (test helper)

## Ops / diagnostics
- `ops.health.get`
  - roles: hr_admin/hr_reader
  - idempotent: yes
  - output: environment, build metadata and operational checks for web/db/resend/sentry/ai-webhook config
  - cli: `ops health`
- `ops.aiDiagnostics.list`
  - roles: hr_admin/hr_reader
  - idempotent: yes
  - output: AI jobs + latest webhook receipt per job with duplicate delivery marker
  - cli: `ops ai`
- `ops.audit.list`
  - roles: hr_admin/hr_reader
  - idempotent: yes
  - output: audit/release rows with redaction rules for `hr_reader`
  - cli: `ops audit`

## System (utility)
- `system.ping`
  - roles: any (including unauthenticated if we choose)
  - idempotent: yes
  - cli: `ping`

## Implementation entrypoints
- `packages/client/src/features/`
- `packages/core/src/features/`
- `packages/cli/src/legacy.ts`
- `apps/web/src/app/api/`

## Primary tests
- `packages/cli/src/ft-0204-xe-cli.test.ts`
- `apps/web/playwright/tests/ft-0171-model-catalog.spec.ts`
- `apps/web/playwright/tests/ft-0181-reminder-schedule-editor.spec.ts`
