---
description: FT-0103-runbook-recovery-drill feature plan and evidence entry for EP-010-prod-readiness.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-010-prod-readiness/index.md
epic: EP-010
feature: FT-0103
---


# FT-0103 — Runbook and recovery drill
Status: Completed (2026-03-06)

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
  - Date: `2026-03-06`
- Steps:
  1. Пройти release checklist.
  2. Пройти rollback/recovery checklist.
  3. Повторно выполнить smoke.
- Expected:
  - команды и шаги достаточны;
  - beta возвращается в healthy state.

## Quality checks evidence (2026-03-06)
- `N/A` — FT docs/runbook/workflow closeout; code-quality gate here опирается на уже зелёные `CI` + `Beta Smoke` на merge commit `41e03a454ff16b3f567bf53bf23975097ce358a5`.
- `node scripts/audit-memory-bank.mjs --ep EP-010` → passed after status/evidence sync.

## Acceptance evidence (2026-03-06, beta)
- Recovery walkthrough executed against current `develop` deployment on `beta`.
- Commands/results:
  - `vercel inspect beta.go360go.ru` → production alias points to `go360go-beta-19am2wu86-deksdens-projects.vercel.app`, status `Ready`.
  - `curl -isS https://beta.go360go.ru/api/health` → `200 {"ok":true,"appEnv":"beta"}`.
  - `curl -isS https://beta.go360go.ru/auth/login` → `200` and login page HTML.
  - Browser spot-check via `$agent-browser`/`npx agent-browser`: login page renders, demo login reaches select-company.
- Runbook updates from drill:
  - added explicit shared-beta-DB rule: seed-based remote checks must not run concurrently;
  - documented serialized `beta-smoke.yml` workflow concurrency.
- Artifacts:
  - `![ft-0103-beta-login](../../../../../evidence/EP-010/FT-0103/2026-03-06/step-01-beta-login.png)`
  - `step-01-beta-login-snapshot.txt` — `../../../../../evidence/EP-010/FT-0103/2026-03-06/step-01-beta-login-snapshot.txt`
  - `step-02-beta-health.txt` — `../../../../../evidence/EP-010/FT-0103/2026-03-06/step-02-beta-health.txt`
  - `step-03-beta-auth-login.txt` — `../../../../../evidence/EP-010/FT-0103/2026-03-06/step-03-beta-auth-login.txt`
  - `step-04-beta-vercel-inspect.txt` — `../../../../../evidence/EP-010/FT-0103/2026-03-06/step-04-beta-vercel-inspect.txt`
