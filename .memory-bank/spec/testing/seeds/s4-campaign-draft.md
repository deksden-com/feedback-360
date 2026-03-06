# Seed S4_campaign_draft
Status: Draft (2026-03-03)

## Purpose
Draft campaign, готовая к настройке матрицы и участников, с уже привязанной published indicators model.

## Requires
- `S2_org_basic`
- `S3_model_indicators` (или levels вариант, когда появится)

## Creates
- campaign status=`draft`
- published indicators model (`model.version.main`)
- no campaign participants by умолчанию; scenario предназначен как база для matrix/participants операций
- default weights (`40/30/30`, self=`0`) и default company timezone

## Handles (examples)
- `company.main`
- `campaign.main`
- `model.version.main`
- `department.root`, `department.a`, `department.b`
- `employee.ceo`, `employee.head_a`, `employee.head_b`

## Variants (edge cases)
- `no_participants`:
  - alias текущего базового поведения; используется в сценариях, где важно явно подчеркнуть отсутствие participants перед matrix/department flows.
