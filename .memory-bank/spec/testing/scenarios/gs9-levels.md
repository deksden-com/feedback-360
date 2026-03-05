# GS9 — Levels mode/distribution rules
Status: Active (2026-03-05)

## Setup
- Seed: `S7_campaign_started_some_submitted --variant levels_tie`
- В данных есть:
  - UNSURE ответы,
  - tie по mode (2 и 3 поровну в merged group).

## Action
1) `company use <handles.company.main> --role hr_admin --json`
2) `results hr --campaign <handles.campaign.main> --subject <handles.employee.subject_main> --small-group-policy merge_to_other --json`

## Assertions
- `modelKind = levels`.
- `competencyScores[0].otherLevels.modeLevel = null` при tie.
- `competencyScores[0].otherLevels.distribution = { level2: 2, level3: 2 }`.
- `competencyScores[0].managerLevels.nUnsure = 1`, `nValid = 0` (UNSURE исключён из агрегаций).

## Client API ops (v1)
- `results.getHrView`
