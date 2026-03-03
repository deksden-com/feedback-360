# Seed S3_model_levels (planned)
Status: Draft (2026-03-03)

## Purpose
Уровневая модель компетенций для тестов “levels” (1..4 + UNSURE), чтобы GS9 и FT-0054 не зависели от indicators.

## Requires
- `S1_company_min`

## Creates
- 1 `competency_model_versions` с `kind=levels`
- `competencies` + `competency_levels` (level 1..4 с описаниями)
- (опционально) группы компетенций с весами

## Handles (examples)
- `company.main`
- `model_version.levels_main`
- `competency.communication`
- `competency_levels.communication.1` … `.4`

## Notes
- Этот seed создаёт только модель. Для сценариев результатов (mode/distribution) используем кампанию+ответы через seed `S7_campaign_started_some_submitted --variant levels_tie` (см. `S7` variants).
