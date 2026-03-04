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
- `employee.subject_main`
- `employee.head_a` (pending rater x2)
- `employee.staff_a1`, `employee.staff_a2` (pending subjects)

## Variants (edge cases)
- `na_heavy_peer` (**implemented**, FT-0051):
  - кампания связывается с indicator-моделью (3 индикатора на компетенцию),
  - создаются 3 submitted анкеты для одного subject: manager + peer + peer,
  - один peer отвечает `NA` по большинству индикаторов, чтобы проверить:
    - исключение `NA` из per-rater score,
    - equal-rater weighting на уровне группы (не indicator-weighted average).
  - Handles дополнительно включают:
    - `employee.subject_main`, `employee.rater_manager`, `employee.rater_peer_1`, `employee.rater_peer_2`,
    - `model.version.main`, `competency.main`, `indicator.main_1..3`,
    - `questionnaire.subject_manager`, `questionnaire.subject_peer_1`, `questionnaire.subject_peer_2`.
- `peers2` (**implemented**, FT-0052):
  - кампания связывается с indicator-моделью (2 компетенции, 2 индикатора),
  - создаются 4 submitted анкеты для одного subject: manager + peer + peer + subordinate,
  - распределение для проверки анонимности:
    - peers=2 и subordinates=1 (обе группы ниже threshold=3),
    - при `merge_to_other` объединённая группа `other` имеет `n=3` и становится `shown`,
    - для `competency.secondary` валидный `n_valid=1`, поэтому `otherVisibility=hidden` на уровне компетенции.
  - Handles дополнительно включают:
    - `employee.subject_main`, `employee.rater_manager`, `employee.rater_peer_1`, `employee.rater_peer_2`, `employee.rater_subordinate_1`,
    - `model.version.main`, `competency.main`, `competency.secondary`, `indicator.main_1`, `indicator.secondary_1`,
    - `questionnaire.subject_manager`, `questionnaire.subject_peer_1`, `questionnaire.subject_peer_2`, `questionnaire.subject_subordinate_1`.
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
