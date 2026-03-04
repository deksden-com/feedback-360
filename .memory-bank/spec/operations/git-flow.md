# Git flow
Status: Draft (2026-03-04)

## Purpose
Зафиксировать единый процесс ветвления и релизов для beta/prod, чтобы избежать "случайных" деплоев и разъезда окружений.

## Branches
- `main`: production branch. Любой push в `main` деплоится в `go360go-prod` на `go360go.ru`.
- `develop`: staging branch. Любой push в `develop` деплоится в `go360go-beta` на `beta.go360go.ru`.
- `feature/*`: рабочие фича-ветки, создаются от `develop`.

## Promotion path
1. Работа идет в `feature/*`.
2. Merge `feature/* -> develop` через PR.
3. Проверка на beta (`beta.go360go.ru`): smoke/e2e/ручная приемка.
4. Merge `develop -> main` через PR.
5. Production deploy на `go360go.ru`.

## Rules
- Прямые коммиты в `main` запрещены; только PR из `develop`.
- Перед merge в `develop` обязательны `lint`, `typecheck`, `test`.
- Для фич-коммитов используем тег трассировки из memory bank: `[FT-xxxx]`.
- Деплой-конфигурация и env vars синхронизируются по документу:
  - [Deployment architecture](deployment-architecture.md) — соответствие окружений и внешних сервисов. Читать, чтобы не смешивать beta/prod секреты.

## Rollback
- Если проблема на beta: откат merge в `develop` (revert PR) и автоматический redeploy beta.
- Если проблема на prod: откат merge в `main` (revert PR) и автоматический redeploy prod.
- Если требуется экстренный hotfix:
  1. ветка `hotfix/*` от `main`,
  2. merge в `main`,
  3. затем обязательный merge `main -> develop`, чтобы ветки не расходились.
