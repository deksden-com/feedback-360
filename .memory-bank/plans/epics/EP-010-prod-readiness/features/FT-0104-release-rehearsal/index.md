# FT-0104 — Release rehearsal
Status: Draft (2026-03-05)

## User value
Первый реальный релиз в `prod` проходит по уже отрепетированному сценарию: миграции, deploy, smoke и acceptance доказаны заранее.

## Deliverables
- Release rehearsal checklist.
- Прогон full cycle на `beta` или prod-like маршруте.
- Evidence: CI run, deploy links, smoke results, post-deploy verification.

## Context (SSoT links)
- [Runbook](../../../../../spec/operations/runbook.md): базовый release path. Читать, чтобы rehearsal был по официальному сценарию.
- [Deployment architecture](../../../../../spec/operations/deployment-architecture.md): окружения и источники конфигурации. Читать, чтобы rehearsal отражал реальный deploy path.
- [Delivery standards](../../../../../spec/engineering/delivery-standards.md): required evidence и release gates. Читать, чтобы rehearsal стал частью готовности к prod.

## Acceptance (manual/process)
### Setup
- Доступны `beta` и `prod` deploy pipelines.

### Action
1) Пройти полный release path на rehearsal-сценарии.
2) Выполнить migrate/deploy/smoke.
3) Сохранить evidence и найденные gaps.

### Assert
- Все шаги воспроизводимы.
- Нет “ручной магии”, не записанной в docs.
- Найденные gaps превращены в follow-up items.

## Implementation plan (target repo)
- Собрать canonical release checklist.
- Определить rehearsal scope и actors.
- Пройти rehearsal.
- Зафиксировать результаты и follow-ups.

## Tests
- Release smoke bundle.
- Cross-check CI/CD + deploy + browser smoke evidence.

## Memory bank updates
- Обновить [Runbook](../../../../../spec/operations/runbook.md), [Deployment architecture](../../../../../spec/operations/deployment-architecture.md), [Delivery standards](../../../../../spec/engineering/delivery-standards.md).

## Verification (must)
- Rehearsal evidence with deploy links and smoke screenshots/logs.
- Must run: full release checklist once end-to-end.

## Manual verification (deployed environment)
- Environment:
  - target: `beta` rehearsal first
  - Date: `2026-03-05`
- Steps:
  1. Запустить CI/CD path.
  2. Подтвердить deploy readiness.
  3. Выполнить browser smoke и operational checks.
- Expected:
  - release path полностью воспроизводим;
  - evidence достаточно для уверенного выхода в `prod`.
