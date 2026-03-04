# Requirements traceability (facts → spec → tests)
Status: Draft (2026-03-03)

Цель: убедиться, что ключевые факты/инварианты из ТЗ:
1) зафиксированы в SSoT-спеке,
2) покрыты автосценариями (golden) и seed-фикстурами.

Формат:
- **Invariant**: что не должно нарушаться.
- **Spec SSoT**: где это описано нормативно.
- **Tests**: какой golden scenario должен это проверять.
- **Seeds**: какой seed нужен для воспроизводимости.

## Identity / access
- Invariant: public signups off, доступ только если email есть в HR-справочнике.
  - Spec SSoT: `../security/auth-and-identity.md`
  - Tests: GS4 (planned)
  - Seeds: `S1_company_min`, `S1_company_roles_min` (planned), `S1_multi_tenant_min`

- Invariant: User (Auth) ≠ Employee (HR); user соответствует email и может состоять в нескольких компаниях.
  - Spec SSoT: `../security/auth-and-identity.md`, `../glossary.md`
  - Tests: GS4 (planned)
  - Seeds: `S1_multi_tenant_min`

## Campaign lifecycle & mutability
- Invariant: после `started` нельзя менять модель и состав участников.
  - Spec SSoT: `../domain/campaign-lifecycle.md`
  - Tests: GS6 (planned)
  - Seeds: `S4_campaign_draft`, `S5_campaign_started_no_answers`

- Invariant: первый draft save фиксирует `campaign.locked_at`; после lock нельзя менять матрицу и веса.
  - Spec SSoT: `../domain/campaign-lifecycle.md`
  - Tests: GS5 (planned)
  - Seeds: `S5_campaign_started_no_answers`, `S6_campaign_started_some_drafts`

- Invariant: после `ended` анкеты read-only.
  - Spec SSoT: `../domain/questionnaires.md`, `../domain/campaign-lifecycle.md`
  - Tests: GS1 + GS6 (planned)
  - Seeds: `S8_campaign_ended`

- Invariant: оргданные/роли/связи в кампании — это снапшот на момент старта и не обновляется после старта.
  - Spec SSoT: `../domain/org-structure.md`
  - Tests: GS8 (baseline implemented in FT-0032 via `campaign.snapshot.list`; matrix/results coupling planned next slices)
  - Seeds: `S4_campaign_draft`, `S5_campaign_started_no_answers`

## Privacy / anonymity / calculations
- Invariant: indicators-агрегация использует `equal rater weighting` (а не “среднее по всем indicator answers”); NA исключается из per-rater score.
  - Spec SSoT: `../domain/calculations.md`
  - Tests: FT-0051 acceptance (`results.getHrView`)
  - Seeds: `S7_campaign_started_some_submitted --variant na_heavy_peer`

- Invariant: anonymity threshold=3 для peers/subordinates; manager всегда персонально; self вес 0.
  - Spec SSoT: `../domain/anonymity-policy.md`, `../domain/calculations.md`
  - Tests: GS2 + GS1
  - Seeds: `S7_campaign_started_some_submitted`

- Invariant: open text сотруднику/руководителю — только AI-processed/summary; HR видит raw (включая HR reader).
  - Spec SSoT: `../domain/results-visibility.md`, `../domain/anonymity-policy.md`, `../operations/data-retention-privacy.md`
  - Tests: GS1
  - Seeds: `S9_campaign_completed_with_ai`

- Invariant: threshold применяется и на уровне (group × competency), чтобы NA/UNSURE не снижали анонимность “точечно”.
  - Spec SSoT: `../domain/anonymity-policy.md`
  - Tests: GS2 (расширить: одна компетенция `n_valid<3`, другая `>=3`)
  - Seeds: `S7_campaign_started_some_submitted` (variants: `peers2`, per-competency `n_valid<3`)

- Invariant: levels модель — mode+distribution; tie-break → `mode_level = null`; UNSURE исключаем из агрегаций.
  - Spec SSoT: `../domain/calculations.md`, `../glossary.md`
  - Tests: GS9 (planned, levels)
  - Seeds: `S3_model_levels` (planned) + `S7_campaign_started_some_submitted --variant levels_tie` (planned)

## Notifications
- Invariant: email-only MVP; outbox идемпотентен; расписание по таймзоне кампании.
  - Spec SSoT: `../notifications/notifications.md`, `../notifications/templates-ru-v1.md`
  - Tests: GS7 (planned)
  - Seeds: `S5_campaign_started_no_answers`

- Invariant: при старте кампании система отправляет invite (magic link) участникам/оценщикам через outbox без дублей.
  - Spec SSoT: `../notifications/notifications.md`, `../notifications/outbox-and-retries.md`, `../security/auth-and-identity.md`
  - Tests: GS13 (planned)
  - Seeds: `S4_campaign_draft`

- Invariant: Telegram delivery не в MVP, но `telegram_user_id/chat_id` храним.
  - Spec SSoT: `../notifications/telegram-mvp-placeholder.md`, `../domain/org-structure.md`
  - Tests: unit/schema checks (planned)
  - Seeds: `S2_org_basic`

## AI
- Invariant: AI job по `campaign_id`; webhook HMAC + ai_job_id + idempotency + retries; campaign statuses `processing_ai/ai_failed/completed`.
  - Spec SSoT: `../ai/ai-processing.md`, `../security/webhooks-ai.md`, `../domain/campaign-lifecycle.md`
  - Tests: GS3 + GS1
  - Seeds: `S8_campaign_ended`, `S9_campaign_completed_with_ai`

## Engineering / RLS
- Invariant: multi-tenant изоляция усиливается RLS “deny by default”; service-role операции для cron/outbox/webhooks.
  - Spec SSoT: `../security/rls.md`, `../operations/runbook.md`
  - Tests: GS10 (planned, RLS smoke)
  - Seeds: `S1_multi_tenant_min`

## Assignments autogeneration
- Invariant: автогенерация матрицы учитывает выбранные подразделения и иерархию; руководители одного уровня — peers.
  - Spec SSoT: `../domain/assignments-and-matrix.md`, `../domain/org-structure.md`
  - Tests: GS11 (baseline implemented in FT-0033)
  - Seeds: `S4_campaign_draft --variant no_participants` (preferred), либо композиция `S2_org_basic` + `S3_model_indicators`

## Campaign progress
- Invariant: HR видит прогресс заполнения анкет (кто not_started/in_progress/submitted), чтобы управлять напоминаниями.
  - Spec SSoT: `../domain/questionnaires.md`, `../security/rbac.md`
  - Tests: GS12 (implemented, FT-0046)
  - Seeds: `S7_campaign_started_some_submitted`
