# AI processing (open text)
Status: Draft (2026-03-03)

## Purpose (agreed)
AI обрабатывает открытые текстовые комментарии:
- переписывает “стандартным слогом” без потери смысла,
- делает summary, сохраняя важные пункты.

## Invocation (agreed)
- Запуск AI job выполняется по `campaign_id` (кампания оценки).
- AI сервис присылает результат webhook’ом обратно.

## Granularity (agreed)
Результат хранится агрегированно:
- `(campaign_id, subject_employee_id, competency_id, rater_group)` → `processed_text` + `summary`.

## Campaign statuses (agreed)
`ended -> processing_ai -> (completed | ai_failed)`, доступен retry.

## Visibility (agreed)
- Employee/Manager: только processed/summary и только при anonymity threshold.
- HR: raw + processed/summary.

