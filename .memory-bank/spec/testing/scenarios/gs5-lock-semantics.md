# GS5 — Lock semantics (draft save) (planned)
Status: Baseline Implemented (2026-03-04)

## Setup
- Seed: `S5_campaign_started_no_answers`

## Action
1) HR меняет матрицу/веса (должно быть разрешено).
2) Rater делает `save-draft` (кампания locked).
3) HR пытается изменить матрицу/веса.

## Assertions
- После шага 2 выставлен `campaign.locked_at`.
- Шаг 3 возвращает ошибку `campaign_locked` (или аналогичный code) и изменений нет.

## Client API ops (v1)
- `campaign.weights.set`
- `matrix.set`
- `questionnaire.saveDraft` (триггер lock)

## CLI example
1) `seed --scenario S5_campaign_started_no_answers --json` → `handles.campaign.main`
2) `campaign weights set <handles.campaign.main> --manager 40 --peers 30 --subordinates 30` (должно пройти)
3) `matrix set <handles.campaign.main> ...` (должно пройти)
4) `questionnaire save-draft <questionnaire_id> ...` (lock)
5) повтор шагов 2–3 → ожидаем ошибку `campaign_locked`
