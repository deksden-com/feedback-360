# Seed S9_campaign_completed_with_ai
Status: Draft (2026-03-03)

## Purpose
Completed campaign с AI-processed текстовыми агрегатами.

## Requires
- `S8_campaign_ended`

## Creates
- campaign status=completed
- submitted questionnaires with `competencyComments` bundles (`rawText`, `processedText`, `summaryText`) per competency
- deterministic subject/rater handles for `results my/team/hr` visibility checks
