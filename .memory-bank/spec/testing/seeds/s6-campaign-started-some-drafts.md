# Seed S6_campaign_started_some_drafts
Status: Draft (2026-03-03)

## Purpose
Started campaign, где уже был draft save → campaign locked.

## Requires
- `S5_campaign_started_no_answers`

## Creates
- one questionnaire in `in_progress` with saved structured draft answers (`indicatorResponses`, `competencyComments`, `finalComment`)
- sets `campaign.locked_at`

## Handles
- `company.main`
- `campaign.main`
- `questionnaire.main`
- `questionnaire.main_in_progress`
- `model.version.main`
- `competency.main`
- `competency.secondary`
- `indicator.main_1`
- `indicator.main_2`
- `indicator.main_3`
- `indicator.secondary_1`
