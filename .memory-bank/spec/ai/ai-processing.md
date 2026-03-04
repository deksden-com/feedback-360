# AI processing (open text)
Status: Draft (2026-03-03)

## Purpose (agreed)
AI обрабатывает открытые текстовые комментарии:
- переписывает “стандартным слогом” без потери смысла,
- делает summary, сохраняя важные пункты.

## Invocation (agreed)
- Запуск AI job выполняется по `campaign_id` (кампания оценки).
- AI сервис присылает результат webhook’ом обратно.

## MVP mode (agreed)
- В MVP включён `mvp_stub` режим для `ai.runForCampaign`: внешнего вызова нет.
- Поведение stub: операция синхронно переводит кампанию `ended -> processing_ai -> completed` в рамках одного запуска и создаёт `ai_job`.
- Повторный `ai.runForCampaign` для той же кампании идемпотентен: возвращается существующий completed job без дублей.
- Реальный внешний вызов и webhook остаются для следующего этапа (EP-007 FT-0072/FT-0073).

## Granularity (agreed)
Результат хранится агрегированно:
- `(campaign_id, subject_employee_id, competency_id, rater_group)` → `processed_text` + `summary`.

## Campaign statuses (agreed)
`ended -> processing_ai -> (completed | ai_failed)`, доступен retry.

## Visibility (agreed)
- Employee/Manager: только processed/summary и только при anonymity threshold.
- HR: raw + processed/summary.
