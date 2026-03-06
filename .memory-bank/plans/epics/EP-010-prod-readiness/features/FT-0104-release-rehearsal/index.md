# FT-0104 — Release rehearsal
Status: Completed (2026-03-06)

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
  - Date: `2026-03-06`
- Steps:
  1. Запустить CI/CD path.
  2. Подтвердить deploy readiness.
  3. Выполнить browser smoke и operational checks.
- Expected:
  - release path полностью воспроизводим;
  - evidence достаточно для уверенного выхода в `prod`.

## Quality checks evidence (2026-03-06)
- `CI` on merge commit `41e03a454ff16b3f567bf53bf23975097ce358a5` → `success`.
- `Beta Smoke` workflow run `22752569106` → `success`.
- Manual beta smoke rerun:
  - `PLAYWRIGHT_BASE_URL=https://beta.go360go.ru pnpm --filter @feedback-360/web test:smoke:beta` → passed (`5 passed`).
- `node scripts/audit-memory-bank.mjs --ep EP-010` → passed after final doc sync.

## Acceptance evidence (2026-03-06, beta-first rehearsal)
- Full release path exercised:
  1. Feature PR `#27` merged into `develop` → merge commit `41e03a454ff16b3f567bf53bf23975097ce358a5`.
  2. Required `CI` run on `develop` merge commit completed successfully.
  3. `beta.go360go.ru` promoted to fresh production deployment `go360go-beta-19am2wu86-deksdens-projects.vercel.app`.
  4. `Beta Smoke` workflow rerun completed successfully after serializing seed-based checks.
  5. Manual browser smoke via `$agent-browser` confirmed auth login and select-company route.
- Additional beta acceptance:
  - `PLAYWRIGHT_BASE_URL=https://beta.go360go.ru pnpm --filter @feedback-360/web exec playwright test --config playwright/playwright.config.mjs tests/ft-0101-results-privacy.spec.ts` → passed on deployed beta.
- Artifacts:
  - `step-01-ci-run.txt` — `../../../../../evidence/EP-010/FT-0104/2026-03-06/step-01-ci-run.txt`
  - `step-02-merge-commit-checks.json` — `../../../../../evidence/EP-010/FT-0104/2026-03-06/step-02-merge-commit-checks.json`
  - `step-03-beta-smoke-run.json` — `../../../../../evidence/EP-010/FT-0104/2026-03-06/step-03-beta-smoke-run.json`
  - `![ft-0104-select-company](../../../../../evidence/EP-010/FT-0104/2026-03-06/step-02-beta-select-company.png)`
  - `step-02-beta-select-company-snapshot.txt` — `../../../../../evidence/EP-010/FT-0104/2026-03-06/step-02-beta-select-company-snapshot.txt`
  - `step-02-beta-select-company-url.txt` — `../../../../../evidence/EP-010/FT-0104/2026-03-06/step-02-beta-select-company-url.txt`
