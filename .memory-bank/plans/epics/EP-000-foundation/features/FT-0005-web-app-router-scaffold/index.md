---
description: FT-0005-web-app-router-scaffold feature plan and evidence entry for EP-000-foundation.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-000-foundation/index.md
epic: EP-000
feature: FT-0005
---


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

## Quality checks evidence (2026-03-04)
- `pnpm -r lint` — passed (workspace gate, коммитный набор EP-000).
- `pnpm -r typecheck` — passed (workspace gate, коммитный набор EP-000).
- `pnpm -r test` — passed (workspace gate, коммитный набор EP-000).
- `pnpm --filter @feedback-360/web build` — passed.

## Acceptance evidence (2026-03-04)
- Local runtime check:
  - `pnpm --filter @feedback-360/web exec next dev --hostname 127.0.0.1 --port 4010`
  - `curl http://127.0.0.1:4010/api/health` → `{"ok":true,"appEnv":"unknown"}` (HTTP 200).
- Build smoke:
  - `pnpm --filter @feedback-360/web build` завершён успешно.
