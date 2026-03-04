# Seed S8_campaign_ended
Status: Implemented (2026-03-04)

## Purpose
Ended campaign: анкеты должны быть read-only.

## Requires
- Базируется на `S5_campaign_started_no_answers` и меняет статус кампании на `ended`.

## Creates
- `campaign.main` со статусом `ended`
- `questionnaire.main` в этой кампании (для read-only / post-end сценариев)
- handles:
  - `company.main`
  - `campaign.main`
  - `questionnaire.main`
  - org handles из `S2_org_basic`
