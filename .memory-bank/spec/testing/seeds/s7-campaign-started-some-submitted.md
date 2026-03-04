# Seed S7_campaign_started_some_submitted
Status: Active (2026-03-04)

## Purpose
Started кампания с частично заполненными анкетами для progress/анонимности/агрегаций.

## Requires
- `S5_campaign_started_no_answers`

## Creates
- 3 анкеты в `campaign.main`:
  - `questionnaire.main_not_started` (`not_started`),
  - `questionnaire.main_in_progress` (`in_progress`, есть `firstDraftAt`),
  - `questionnaire.main_submitted` (`submitted`, есть `firstDraftAt` и `submittedAt`).
- `campaign.lockedAt` установлен.

## Handles
- `company.main`
- `campaign.main`
- `questionnaire.main`
- `questionnaire.main_not_started`
- `questionnaire.main_in_progress`
- `questionnaire.main_submitted`
- `employee.head_a` (pending rater x2)
- `employee.staff_a1`, `employee.staff_a2` (pending subjects)

## Variants (edge cases)
- Текущая реализация variant не поддерживает; кейсы ниже запланированы под EP-005.
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
- Для FT-0046 deterministic ожидания:
  - `statusCounts = { notStarted: 1, inProgress: 1, submitted: 1 }`,
  - `pendingQuestionnaires = 2`,
  - `pendingByRater[0].pendingCount = 2` (head_a).
