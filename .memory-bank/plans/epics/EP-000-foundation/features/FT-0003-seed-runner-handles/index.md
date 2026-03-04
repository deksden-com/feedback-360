# FT-0003 — Seed runner + handles contract
Status: Completed (2026-03-04)

## User value
Можно быстро получать стандартные состояния БД для тестов/e2e и отладки через CLI; тесты не зависят от случайных id.

## Deliverables
- Client API op: `seed.run` (см. `.memory-bank/spec/client-api/operation-catalog.md`).
- CLI: `seed --scenario <Sx> --json` возвращает `{scenario, handles}`.
- Seed catalog docs: `.memory-bank/spec/testing/seeds/*`.

## Context (SSoT links)
- [Seed scenarios principles](../../../../../spec/testing/seed-scenarios.md): контракт seed данных, handles и композиция сценариев. Читать, чтобы seed runner был детерминированным и пригодным для тестов.
- [Seed catalog](../../../../../spec/testing/seeds/index.md): список seeds и их handles. Читать, чтобы CLI/testkit могли ссылаться на стабильные ключи.
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): SSoT списка операций (включая `seed.run`). Читать, чтобы seed вызов был “официальной” операцией, а не ad-hoc скриптом.
- [CLI spec](../../../../../spec/cli/cli.md): правила `--json` (AI-friendly). Читать, чтобы выход seed был стабильным и машиночитаемым.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист реализации фич. Читать, чтобы seed runner был покрыт тестами и документацией.

## Acceptance (auto)
### Setup
- DB: применены миграции (см. FT-0002).

### Action (CLI, `--json`)
1) `pnpm seed --scenario S1_company_min --json`
2) `pnpm seed --scenario S2_org_basic --json`

### Assert
- Ответ — валидный JSON с полями `scenario` и `handles`.
- `handles` содержит ключи, описанные в seed catalog (например `company.main`, `user.hr_admin`).

### Client API ops (v1)
- `seed.run`

## Implementation plan (target repo)
- Contract:
  - Добавить/зафиксировать op `seed.run` (input: `scenario`, optional `variant`; output: `{scenario, handles}`).
- DB:
  - В `packages/db` реализовать сценарии как функции, которые:
    - создают данные детерминированно,
    - возвращают `handles` (ключи → id/email).
  - Поддержать композицию seeds (например `S4_campaign_draft` использует `S2_org_basic` + `S3_model_*`).
- CLI:
  - Команда `seed --scenario ... [--variant ...] --json` вызывает typed client op.
  - По умолчанию human output (короткий summary), при `--json` — чистый JSON.

## Tests
- Contract: JSON schema для `seed.run` output + пример golden output (минимальный).
- Integration: запуск `seed.run` против тестовой БД (после миграций) и проверка наличия ключевых handles.

## Memory bank updates
- При добавлении новых seeds/handles обновлять: [Seed catalog](../../../../../spec/testing/seeds/index.md) — SSoT списка. Читать, чтобы acceptance сценарии не ломались от несостыковок.

## Verification (must)
- Automated test: `packages/db/src/migrations/ft-0003-seed-runner.test.ts` (integration) вызывает `seed.run` и валидирует `{scenario, handles}`.
- Must run: `pnpm seed --scenario S1_company_min --json` и `pnpm seed --scenario S2_org_basic --json` (или эквивалент через typed op) и сравнить наличие ожидаемых handles.

## Implementation result (2026-03-04)
- Реализован typed contract `seed.run` в `packages/api-contract`.
- Реализован DB seed runner в `packages/db/src/seeds.ts` со сценариями:
  - `S0_empty`
  - `S1_company_min`
  - `S2_org_basic`
- Реализован typed in-proc client вызов `seedRun` в `packages/client`.
- Реализован CLI на Commander (`packages/cli`) с human + `--json` форматами.
- Добавлена root-команда: `pnpm seed --scenario <Sx> [--json]`.
- Добавлен integration тест: `packages/db/src/migrations/ft-0003-seed-runner.test.ts`.

## Acceptance evidence (2026-03-04)
- CLI run:
  1) `pnpm seed --scenario S1_company_min --json` → валидный JSON с `scenario=S1_company_min` и handles (`company.main`, `employee.hr_admin`, `user.hr_admin`).
  2) `pnpm seed --scenario S2_org_basic --json` → валидный JSON с expected handles (`department.root`, `employee.ceo`, `employee.head_a`, ...).
- Integration test:
  - `pnpm --filter @feedback-360/db test` → `src/migrations/ft-0003-seed-runner.test.ts` passed.
