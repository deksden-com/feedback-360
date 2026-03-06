# Seed S5_campaign_started_no_answers
Status: Draft (2026-03-03)

## Purpose
Started campaign с матрицей назначений, но без draft/submitted.

## Requires
- `S2_org_basic`

## Creates
- campaign `campaign.main` со статусом `started`, `locked_at=null`
- questionnaire model version `model.version.main` (indicators) c двумя компетенциями
- одна анкета `questionnaire.main` со статусом `not_started` (без draft/submitted)
- контекст компании и сотрудников из `S2_org_basic` (детерминированные handles)

## Handles
- `company.main`
- `campaign.main`
- `questionnaire.main`
- `model.version.main`
- `competency.main`
- `competency.secondary`
- `indicator.main_1`
- `indicator.main_2`
- `indicator.main_3`
- `indicator.secondary_1`
