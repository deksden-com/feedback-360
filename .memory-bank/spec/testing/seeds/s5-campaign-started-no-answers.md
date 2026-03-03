# Seed S5_campaign_started_no_answers
Status: Draft (2026-03-03)

## Purpose
Started campaign с матрицей назначений, но без draft/submitted.

## Requires
- `S4_campaign_draft`

## Creates
- campaign status=started, locked_at=null
- assignments (matrix)
- questionnaires rows (optional: pre-created for each assignment)

## Handles
- `campaign.main`

