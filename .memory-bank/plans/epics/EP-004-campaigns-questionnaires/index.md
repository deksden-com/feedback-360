---
description: EP-004-campaigns-questionnaires epic plan, scope, progress, and evidence entrypoint.
purpose: Read to understand the user value, feature map, and completion state of this epic.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/index.md
epic: EP-004
---


# EP-004 — Models + campaigns + questionnaires
Status: Completed (2026-03-04)

## Goal
Сделать “сквозной” процесс оценки без UI: модели → кампания → матрица → анкеты → lock → end.

## Features (vertical slices)
- [Feature catalog](features/index.md): список фич EP-004 с acceptance сценариями. Читать, чтобы собрать сквозной процесс кампании и анкет.

## Scenarios / tests
- GS1 (happy path)
- GS5 (lock semantics)
- GS6 (started immutability)
- GS12 (campaign progress)

## Progress report (evidence-based)
- `as_of`: 2026-03-04
- `total_features`: 6
- `completed_features`: 6
- `evidence_confirmed_features`: 6
- verification link:
  - [Verification matrix](../../verification-matrix.md) — execution evidence по EP-004. Читать, чтобы отслеживать подтверждённый прогресс по одному SSoT-источнику.

## Memory bank updates (after EP completion)
- Подтвердить state machine кампании и анкеты по фактическому коду: [Campaign lifecycle](../../../spec/domain/campaign-lifecycle.md) — статусы и переходы. Читать, чтобы не было “скрытых” переходов.
- Синхронизировать модель анкет (draft/save/submit) и lock semantics: [Questionnaires](../../../spec/domain/questionnaires.md) — статусы и запреты. Читать, чтобы “первый ответ = draft save” был реализован именно так.
- Зафиксировать ограничения immutability после start и после lock: [Golden scenarios index](../../../spec/testing/scenarios/index.md) — GS5/GS6. Читать, чтобы acceptance тесты реально ловили регрессии.
