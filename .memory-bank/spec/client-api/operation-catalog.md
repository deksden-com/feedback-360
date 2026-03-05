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
- `employee.listActive`
  - roles: hr_admin, hr_reader
  - idempotent: yes
  - cli: `employee list-active`
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

## Campaigns
- `campaign.create`
  - roles: hr_admin
  - idempotent: optional
  - cli: `campaign create`
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
  - cli: `questionnaire list`
- `questionnaire.saveDraft`
  - roles: employee/manager/hr_admin
  - idempotent: yes (by questionnaire+item)
  - cli: `questionnaire save-draft`
- `questionnaire.submit`
  - roles: employee/manager/hr_admin
  - idempotent: yes (transition)
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
  - cli: `results hr`

## Notifications
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

## System (utility)
- `system.ping`
  - roles: any (including unauthenticated if we choose)
  - idempotent: yes
  - cli: `ping`
