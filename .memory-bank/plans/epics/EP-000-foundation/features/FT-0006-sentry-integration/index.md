# FT-0006 — Sentry integration (Next.js)
Status: Completed (2026-03-04)

## User value
Ошибки из web runtime наблюдаемы в beta/prod, что уменьшает время диагностики проблем.

## Deliverables
- Sentry SDK подключен в `apps/web`.
- DSN и build-time параметры берутся из env vars.
- Privacy-safe настройки (без лишнего PII по умолчанию).

## Context (SSoT links)
- [Runbook](../../../../../spec/operations/runbook.md) — обязательные проверки перед релизом. Читать, чтобы мониторинг не терялся при деплоях.
- [Deployment architecture](../../../../../spec/operations/deployment-architecture.md) — какие env vars требуются для beta/prod. Читать, чтобы sourcemaps/telemetry работали стабильно.

## Acceptance (auto)
### Action
1) Собрать и запустить `apps/web` с заполненными Sentry env vars.
2) Вызвать тестовый маршрут/ошибку.

### Assert
- Ошибка фиксируется в Sentry проекте нужного окружения.
- Сборка не падает, когда Sentry env vars заданы корректно.

## Verification (must)
- CI: `lint`, `typecheck`, `test` зелёные.
- Ops check: событие появляется в Sentry после тестовой генерации ошибки.
