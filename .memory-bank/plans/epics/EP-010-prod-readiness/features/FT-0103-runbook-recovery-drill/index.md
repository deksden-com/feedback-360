# FT-0103 — Runbook and recovery drill
Status: Draft (2026-03-05)

## User value
В случае инцидента у команды есть не только документы, но и подтверждение, что шаги восстановления действительно работают на практике.

## Deliverables
- Обновлённый runbook с recovery procedures.
- Прогнанный recovery drill с evidence.
- Явные команды/шаги для rollback, health check, smoke verification.

## Context (SSoT links)
- [Runbook](../../../../../spec/operations/runbook.md): текущий операционный baseline. Читать, чтобы drill улучшал существующий документ, а не обходил его.
- [Deployment architecture](../../../../../spec/operations/deployment-architecture.md): beta/prod flow и зависимости. Читать, чтобы recovery учитывал реальные окружения.
- [Git flow](../../../../../spec/operations/git-flow.md): путь develop -> main/prod. Читать, чтобы recovery/release шаги соответствовали веточной модели.

## Acceptance (manual/process)
### Setup
- Есть актуальный runbook.
- Есть тестовое изменение/сценарий для health verification.

### Action
1) Пройти шаги deploy verification.
2) Пройти rollback/recovery walkthrough.
3) Повторно проверить health + smoke.

### Assert
- Runbook можно исполнить без “устных договорённостей”.
- Recovery шаги однозначны и достаточны.
- После drill документ обновлён по найденным зазорам.

## Implementation plan (target repo)
- Аудит текущего runbook.
- Дополнение missing recovery sections.
- Прогон walkthrough/drill на `beta`.
- Фиксация найденных gaps в docs или follow-up FT.

## Tests
- Process drill with explicit checklist.
- Optional scripted health/smoke commands from runbook.

## Memory bank updates
- Обновить [Runbook](../../../../../spec/operations/runbook.md) и, если нужно, [Git flow](../../../../../spec/operations/git-flow.md).

## Verification (must)
- Runbook rehearsal evidence.
- Must run: health endpoint + smoke after simulated recovery steps.

## Manual verification (deployed environment)
- Environment:
  - target: `beta`
  - Date: `2026-03-05`
- Steps:
  1. Пройти release checklist.
  2. Пройти rollback/recovery checklist.
  3. Повторно выполнить smoke.
- Expected:
  - команды и шаги достаточны;
  - beta возвращается в healthy state.
