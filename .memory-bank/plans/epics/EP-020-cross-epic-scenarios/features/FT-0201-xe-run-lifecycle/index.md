---
description: FT-0201-xe-run-lifecycle feature plan and evidence entry for EP-020-cross-epic-scenarios.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-020-cross-epic-scenarios/index.md
epic: EP-020
feature: FT-0201
---


# FT-0201 — XE run lifecycle and cleanup
Status: Completed (2026-03-07)

Пользовательская ценность: инженер или AI-агент может создать, запустить, исследовать и удалить изолированный сценарный run без ручной чистки БД и файловых артефактов.

Deliverables:
- `xe_runs` registry
- workspace provisioning `.xe-runs/...`
- no-concurrency guard for `beta`
- TTL / expired policy
- CLI delete/cleanup operations

Acceptance scenario:
- создать run `XE-001`
- убедиться, что создан registry entry и workspace
- попытка создать второй активный run на `beta` отклоняется
- `xe runs delete <run-id>` удаляет workspace и DB-следы run-а
- `xe runs delete --expired` очищает истёкшие run-ы

## Progress note (2026-03-07)
- Добавлены `xe_runs` и `xe_run_locks`, workspace `.xe-runs/`, explicit cleanup по bindings и environment guard (`local|beta` only).
- Lock держится на environment, имеет TTL и снимается явно через CLI; failed run-ы больше не удаляются автоматически.

## Quality checks evidence (2026-03-07)
- `pnpm --filter @feedback-360/db lint` → passed.
- `pnpm --filter @feedback-360/db typecheck` → passed.
- `pnpm --filter @feedback-360/db test` → passed.

## Acceptance evidence (2026-03-07)
- Automated:
  - `pnpm --filter @feedback-360/db exec vitest run src/ft/ft-0201-xe-run-lifecycle.test.ts` → passed.
  - `pnpm --filter @feedback-360/cli exec vitest run src/ft-0204-xe-cli.test.ts` → passed.
- Covered acceptance:
  - run registry entry и workspace создаются детерминированно;
  - `beta` lock не допускает второй активный run;
  - delete/cleanup работают только по явным bindings.
- Artifacts:
  - run registry snapshot.
    `[.memory-bank/evidence/EP-020/FT-0201/2026-03-07/beta-run.json](../../../../../evidence/EP-020/FT-0201/2026-03-07/beta-run.json)`
