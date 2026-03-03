# Seed S3_model_indicators
Status: Draft (2026-03-03)

## Purpose
Модель компетенций indicators (1..5 + NA) для тестов анкет/расчётов.

## Requires
- `S1_company_min`

## Creates
- competency model version kind=indicators
- competency groups (с весами, если используем)
- competencies + indicators

## Handles (examples)
- `company.main`
- `model_version.main` (alias для “основной” indicators модели)
- `model_version.indicators_main` (если нужно различать явно)
- `competency.communication`
- `indicator.communication.1`, `indicator.communication.2`, …
