# ERD / Tables (conceptual)
Status: Updated (2026-03-05)

Ниже — концептуальный список таблиц (без привязки к конкретным именам/типам в коде, пока не реализовано).

## Tenancy & identity
- `companies` (включая `timezone` как дефолт таймзоны компании)
- `company_memberships (user_id, company_id, role)`
- `employees (company_id, ...)` (включая телефон и `telegram_user_id/chat_id` для будущих уведомлений)
- `employee_user_links (employee_id, user_id)` (MVP: уникальная пара user/employee в рамках company)

## Org structure
- `departments (company_id, parent_id, ...)`
- `employee_department_history (employee_id, department_id, start_at, end_at)`
- `employee_manager_history (employee_id, manager_employee_id, start_at, end_at)`
- `employee_positions (employee_id, title, start_at, end_at)`

## Competency models
- `competency_model_versions (company_id, kind, version, ...)`
- `competency_groups (model_version_id, weight, ...)`
- `competencies (model_version_id, competency_group_id, ...)`
- `competency_indicators (competency_id, order, ...)` (indicators)
- `competency_levels (competency_id, level, ...)` (levels)

## Campaign
- `campaigns (company_id, model_version_id, status, start_at, end_at, timezone, locked_at, ...)`
- `campaign_employee_snapshots (...)`
- `campaign_participants (...)`
- `campaign_assignments (subject_employee_id, rater_employee_id, rater_group, ...)`

## Questionnaires
- `questionnaires (campaign_id, subject_employee_id, rater_employee_id, status, ...)`
- `questionnaire_answers (...)`
- `questionnaire_comments (...)` (optional, per competency + final)

## Results & privacy
- `campaign_results (...)` (витрина/кеш агрегатов)
- `ai_comment_aggregates (campaign_id, subject_employee_id, competency_id, rater_group, raw_text, processed_text, summary_text, source)` (AI text aggregates per group/competency)

## Notifications
- `notification_outbox (...)` + `notification_attempts (...)`

## AI
- `ai_jobs (...)`
- `ai_webhook_receipts (...)` (idempotency/audit)
