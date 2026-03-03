# CLI command catalog (1:1 → Client API op)
Status: Draft (2026-03-03)

Цель: чтобы у каждой команды CLI была **ровно одна** операция typed client API, и чтобы сценарии GS* могли быть автоматизированы через CLI.

Формат записи:
- `command`: строка команды
- `op`: operation name (v1)
- `roles`: кто может вызвать (RBAC)
- `idempotency`: требуется ли `--idempotency-key`

Ссылки (аннотированные):
- [Operation catalog](../client-api/operation-catalog.md): SSoT списка операций и их семантики. Читать, чтобы команда не “придумывала” логику и не расходимся с UI.

## Seeds
- command: `seed --scenario <Sx> [--variant <name>] [--json]`
  - op: `seed.run`
  - roles: hr_admin (dev) / service role (tests)
  - idempotency: no

## Company & memberships
- command: `company create ...`
  - op: `company.create`
  - roles: hr_admin
  - idempotency: optional

- command: `company use <company_id> [--json]`
  - op: `client.setActiveCompany` (client-local)
  - roles: any authenticated (has membership)
  - idempotency: yes

- command: `membership list [--json]` (future)
  - op: `membership.list`
  - roles: any authenticated
  - idempotency: yes

## Employees & org
- command: `employee upsert ...`
  - op: `employee.upsert`
  - roles: hr_admin
  - idempotency: yes (natural key)

- command: `org department create ...`
  - op: `org.department.create`
  - roles: hr_admin
  - idempotency: optional

- command: `org department move ...`
  - op: `org.department.move`
  - roles: hr_admin
  - idempotency: yes

- command: `org set-manager ...`
  - op: `org.manager.set`
  - roles: hr_admin
  - idempotency: yes

## Models
- command: `model version create --kind indicators|levels ...`
  - op: `model.version.create`
  - roles: hr_admin
  - idempotency: optional

## Campaigns
- command: `campaign create ...`
  - op: `campaign.create`
  - roles: hr_admin
  - idempotency: optional

- command: `campaign set-model <campaign_id> <model_version_id>`
  - op: `campaign.setModelVersion`
  - roles: hr_admin
  - idempotency: yes

- command: `campaign participants add <campaign_id> <employee_id>...`
  - op: `campaign.participants.add`
  - roles: hr_admin
  - idempotency: yes

- command: `campaign participants add-departments <campaign_id> --from-departments <dept_id>...`
  - op: `campaign.participants.addFromDepartments`
  - roles: hr_admin
  - idempotency: yes

- command: `campaign participants remove <campaign_id> <employee_id>...`
  - op: `campaign.participants.remove`
  - roles: hr_admin
  - idempotency: yes

- command: `campaign weights set <campaign_id> --manager 40 --peers 30 --subordinates 30`
  - op: `campaign.weights.set`
  - roles: hr_admin
  - idempotency: yes

- command: `campaign start <campaign_id>`
  - op: `campaign.start`
  - roles: hr_admin
  - idempotency: yes

- command: `campaign stop <campaign_id>`
  - op: `campaign.stop`
  - roles: hr_admin
  - idempotency: yes

- command: `campaign end <campaign_id>` (admin/manual helper)
  - op: `campaign.end`
  - roles: hr_admin / service role (cron)
  - idempotency: yes

- command: `campaign progress <campaign_id>`
  - op: `campaign.progress.get`
  - roles: hr_admin/hr_reader
  - idempotency: yes

## Matrix / assignments
- command: `matrix generate <campaign_id> --from-departments <dept_id>...`
  - op: `matrix.generateSuggested`
  - roles: hr_admin
  - idempotency: yes

- command: `matrix set <campaign_id> ...`
  - op: `matrix.set`
  - roles: hr_admin
  - idempotency: optional

## Questionnaires
- command: `questionnaire list [--campaign <id>] [--status not_started|in_progress|submitted]`
  - op: `questionnaire.listAssigned`
  - roles: employee/manager/hr_*
  - idempotency: yes

- command: `questionnaire save-draft <questionnaire_id> ...`
  - op: `questionnaire.saveDraft`
  - roles: employee/manager/hr_*
  - idempotency: yes

- command: `questionnaire submit <questionnaire_id>`
  - op: `questionnaire.submit`
  - roles: employee/manager/hr_*
  - idempotency: yes

## Results
- command: `results my [--campaign <id>]`
  - op: `results.getMyDashboard`
  - roles: employee
  - idempotency: yes

- command: `results team [--campaign <id>] [--subject <employee_id>]`
  - op: `results.getTeamDashboard`
  - roles: manager
  - idempotency: yes

- command: `results hr [--campaign <id>] [--subject <employee_id>]`
  - op: `results.getHrView`
  - roles: hr_admin/hr_reader
  - idempotency: yes

## Notifications
- command: `reminders generate [--campaign <id>]`
  - op: `notifications.generateReminders`
  - roles: service role (cron) / hr_admin (manual)
  - idempotency: yes

- command: `notifications dispatch`
  - op: `notifications.dispatchOutbox`
  - roles: service role (cron) / hr_admin (manual)
  - idempotency: yes

## AI
- command: `ai run <campaign_id>`
  - op: `ai.runForCampaign`
  - roles: hr_admin
  - idempotency: yes (per campaign, unless explicit retry)

## System
- command: `ping [--json]`
  - op: `system.ping`
  - roles: any
  - idempotency: yes
