# Questionnaires
Status: Draft (2026-03-03)

## Model
Анкета = “один rater оценивает одного subject” в конкретной кампании.

## States
- `not_started`: ещё нет сохранённых ответов.
- `in_progress`: есть draft-save.
- `submitted`: анкета отправлена; ответы immutable.

## Draft save / submit rules
- Draft save: сохраняем частично заполненную анкету в любом порядке.
- Submit: валидируем ответы по всем компетенциям (либо валидный score/level, либо NA/UNSURE по правилам модели).
- Комментарии опциональны (на компетенцию и общий финальный).

## Campaign read-only states
После `campaign.status` в одном из состояний:
- `ended`
- `processing_ai`
- `ai_failed`
- `completed`

любые `draft save`/`submit` запрещены (read-only, доменная ошибка `campaign_ended_readonly`).

## Campaign progress projection (HR)
- Операция: `campaign.progress.get` (roles: `hr_admin`, `hr_reader`).
- Возвращает агрегаты `not_started/in_progress/submitted` и pending-списки (`pendingQuestionnaires`, `pendingByRater`, `pendingBySubject`).
- Для pending анкет поддерживаются timestamps `firstDraftAt` (когда уже есть) и `submittedAt` (если есть в записи).

## Implementation entrypoints
- `packages/core/src/features/questionnaires.ts`
- `packages/client/src/features/questionnaires.ts`
- `apps/web/src/app/questionnaires/page.tsx`
- `apps/web/src/app/questionnaires/[questionnaireId]/page.tsx`

## Primary tests
- `packages/cli/src/ft-0013-questionnaire-cli.test.ts`
- `apps/web/playwright/tests/ft-0131-questionnaire-inbox.spec.ts`
- `apps/web/playwright/tests/ft-0132-questionnaire-fill-flow.spec.ts`
- `apps/web/playwright/tests/ft-0133-questionnaire-readonly.spec.ts`
