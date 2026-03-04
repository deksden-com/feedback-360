# Git flow
Status: Draft (2026-03-04)

## Purpose
Зафиксировать единый процесс ветвления и релизов для beta/prod, чтобы избежать "случайных" деплоев и разъезда окружений.

## Branches
- `main`: production branch. Любой push в `main` деплоится в `go360go-prod` на `go360go.ru`.
- `develop`: staging branch. Любой push в `develop` деплоится в `go360go-beta` на `beta.go360go.ru`.
- `feature/*`: рабочие фича-ветки, создаются от `develop`.

## Branch naming (traceability)
Цель: по имени ветки сразу видеть, к какой фиче/эпику относится работа.

- `feature/FT-XXXX-<short-slug>` — по умолчанию для любых изменений, которые входят в конкретную фичу.
- `feature/EP-XXX-<short-slug>` — допустимо, если работа “поперёк” нескольких FT внутри одного эпика (например, рефакторинг инфраструктуры).
- `hotfix/FT-XXXX-<short-slug>` или `hotfix/EP-XXX-<short-slug>` — экстренные правки от `main`.

## Promotion path
1. Работа идет в `feature/*`.
2. Merge `feature/* -> develop` через PR.
3. Проверка на beta (`beta.go360go.ru`): smoke/e2e/ручная приемка.
4. Merge `develop -> main` через PR.
5. Production deploy на `go360go.ru`.

## Commit convention (traceability)
Цель: каждый коммит/PR должен быть однозначно привязан к эпикам/фичам из Memory Bank.

### Mandatory tag `[FT-*]` / `[EP-*]`
- В **каждом** commit message должен быть хотя бы один trace-тег:
  - `[FT-XXXX]` — если коммит относится к конкретной фиче,
  - `[EP-XXX]` — если коммит относится к эпику в целом (инфраструктура/рефакторинг/документация эпика).
- Если коммит затрагивает несколько фич — предпочтительно разбить на несколько коммитов; если нельзя, допускается несколько тегов (первый — основной).

### Message format (recommended)
Используем “conventional commits”-стиль:
- `<type>(<scope>): <summary> [FT-XXXX]`
- `<type>(<scope>): <summary> [EP-XXX]`

Где `type`: `feat|fix|docs|refactor|test|chore|ci|build` (минимум).

Примеры:
- `feat(core): add campaign lock semantics [FT-0044]`
- `docs(memory-bank): refine verification evidence rules [EP-000]`

## PR rules (traceability + verification)
### Mandatory links (Memory Bank)
В PR description обязательно:
- ссылка на Epic doc (если применимо): `EP-XXX` + путь к документу в `.memory-bank/plans/epics/*`,
- ссылка(и) на Feature doc(s): `FT-XXXX` + путь(и) к документам фич.

Смысл: reviewer должен открыть SSoT-план/acceptance без поиска по репозиторию.

### Mandatory checks before merge to `develop`
- CI: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` (или эквивалентный набор в CI).
- Acceptance: после реализации каждой затронутой FT отдельно прогоняется её `Acceptance (auto)` сценарий; в PR должны быть зелёными все такие сценарии.
- Golden scenarios: если фича участвует в GS* — соответствующие GS должны быть зелёными (см. verification matrix).

### Mandatory evidence (recorded)
После того как проверки зелёные, доказательства фиксируем в SSoT:
- [Verification matrix](../../plans/verification-matrix.md) (раздел evidence по соответствующему EP),
- и добавляем ссылку на этот evidence в PR description (чтобы “почему считаем done” было проверяемо).

## Rules
- Прямые коммиты в `main` запрещены; только PR из `develop`.
- Merge в `develop/main` только через PR (никаких “быстрых” push).
- Деплой-конфигурация и env vars синхронизируются по документу:
  - [Deployment architecture](deployment-architecture.md) — соответствие окружений и внешних сервисов. Читать, чтобы не смешивать beta/prod секреты.

## Rollback
- Если проблема на beta: откат merge в `develop` (revert PR) и автоматический redeploy beta.
- Если проблема на prod: откат merge в `main` (revert PR) и автоматический redeploy prod.
- Если требуется экстренный hotfix:
  1. ветка `hotfix/*` от `main`,
  2. merge в `main`,
  3. затем обязательный merge `main -> develop`, чтобы ветки не расходились.
