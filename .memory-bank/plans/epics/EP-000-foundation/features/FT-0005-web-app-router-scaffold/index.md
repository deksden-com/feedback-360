# FT-0005 — Web app scaffold (Next.js App Router)
Status: Completed (2026-03-04)

## User value
Есть рабочий web runtime, который можно деплоить на beta/prod и использовать как базу для следующих vertical slices.

## Deliverables
- `apps/web` с базовым Next.js App Router scaffold.
- Health endpoint для smoke-check деплоя.

## Context (SSoT links)
- [Repo structure](../../../../../spec/project/repo-structure.md) — где должен жить web слой и его границы. Читать, чтобы не смешивать UI и бизнес-логику.
- [Deployment architecture](../../../../../spec/operations/deployment-architecture.md) — как web app включается в beta/prod окружения. Читать, чтобы rollout был предсказуемым.

## Acceptance (auto)
### Action
1) Запустить приложение.
2) Вызвать health endpoint.

### Assert
- Приложение отвечает без ошибок.
- Health endpoint возвращает успешный ответ.

## Verification (must)
- Automated test: smoke checks в CI по web package.
- Manual ops check: health endpoint доступен после деплоя beta/prod.
