# GS11 — Matrix autogeneration from org snapshot (planned)
Status: Baseline Implemented (2026-03-04)

## Setup
- Seed: `S4_campaign_draft --variant no_participants --json` (handles company/campaign/departments/employees/model).
- HR выбирает несколько подразделений (с иерархией).

## Action
1) HR включает участников кампании из выбранных подразделений (с дочерними).
2) HR запускает автогенерацию предложений матрицы.

## Assertions
- Руководитель подразделения становится `manager` для сотрудников подразделения.
- Руководители подразделений одного уровня становятся `peers` (общий вышестоящий руководитель).
- Предложения редактируемы до lock, неизменяемы после lock (см. GS5).

## Client API ops (v1)
- `campaign.participants.addFromDepartments`
- `matrix.generateSuggested`

## CLI example
1) `seed --scenario S4_campaign_draft --variant no_participants --json` → `handles.company.main`, `handles.campaign.main`, `handles.department.a`, `handles.department.b`
2) `company use <handles.company.main> --json`
3) `campaign participants add-departments <handles.campaign.main> --from-departments <handles.department.a> <handles.department.b> --json`
4) `matrix generate <handles.campaign.main> --from-departments <handles.department.a> <handles.department.b> --json`
