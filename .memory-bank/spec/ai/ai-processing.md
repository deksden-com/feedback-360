# AI processing (open text)
Status: Updated (2026-03-05)

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
- Webhook профиль также реализован: валидный webhook применяет статус результата идемпотентно; повторы по ключу обрабатываются как no-op.

## Granularity (agreed)
Результат хранится агрегированно:
- `(campaign_id, subject_employee_id, competency_id, rater_group)` → `raw_text` + `processed_text` + `summary_text`.
- Техническое хранилище: `ai_comment_aggregates` (source=`mvp_stub|webhook`), unique per `(campaign, subject, competency, rater_group)`.
- В MVP агрегаты строятся из `questionnaires.draft_payload.competencyComments` после `ai.runForCampaign`/webhook success.

## Campaign statuses (agreed)
`ended -> processing_ai -> (completed | ai_failed)`, доступен retry.

## Visibility (agreed)
- Employee/Manager: только processed/summary и только при anonymity threshold.
- HR: raw + processed/summary.
