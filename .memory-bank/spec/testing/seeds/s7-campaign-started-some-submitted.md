# Seed S7_campaign_started_some_submitted
Status: Draft (2026-03-03)

## Purpose
Submitted ответы для тестов агрегаций/анонимности.

## Requires
- `S5_campaign_started_no_answers`

## Creates
- несколько submitted questionnaires по группам peers/subordinates/manager/self

## Handles (examples)
- `company.main`
- `campaign.main`
- `employee.subject_main`
- `employee.rater_manager`
- `employee.rater_peer_1`, `employee.rater_peer_2`, `employee.rater_peer_3`
- `employee.rater_sub_1`, `employee.rater_sub_2`, `employee.rater_sub_3`

## Variants (edge cases)
- `peers2`:
  - peers оценщиков ровно 2 (для hide/merge threshold тестов).
  - Используется в GS2/FT-0052.
- `na_heavy_peer`:
  - один peer отвечает NA по большинству индикаторов (для проверки “exclude NA” и equal rater weighting).
  - Используется в FT-0051.
- `no_subordinates`:
  - у subject нет подчинённых (или их группа скрыта), peers>=3 (для нормализации весов 50/50).
  - Используется в FT-0053.
- `levels_tie` (planned):
  - кампания использует `S3_model_levels` и в данных есть:
    - UNSURE ответы,
    - tie за mode (например 2 и 3 поровну) для одной группы.
  - Используется в GS9/FT-0054.

## Notes
- Для per-competency threshold важно, чтобы варианты содержали кейс `n_valid < 3` на одной компетенции при том, что группа в целом проходит порог.
