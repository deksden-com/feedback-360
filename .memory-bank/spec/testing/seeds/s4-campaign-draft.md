# Seed S4_campaign_draft
Status: Draft (2026-03-03)

## Purpose
Draft campaign, готовая к настройке матрицы и участников.

## Requires
- `S2_org_basic`
- `S3_model_indicators` (или levels вариант, когда появится)

## Creates
- campaign status=draft
- participants (employees)
- initial settings (weights default, small_group_policy default)

## Handles (examples)
- `company.main`
- `campaign.main`
- `model_version.main`
- `department.root`, `department.a`, `department.b`
- `employee.ceo`, `employee.head_a`, `employee.head_b`

## Variants (edge cases)
- `no_participants`:
  - кампания создаётся без participants (или с пустым списком), чтобы тестировать `campaign.participants.addFromDepartments`.
