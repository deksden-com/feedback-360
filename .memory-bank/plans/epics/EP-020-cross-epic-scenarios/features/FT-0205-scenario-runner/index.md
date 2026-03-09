---
description: FT-0205-scenario-runner feature plan and evidence entry for EP-020-cross-epic-scenarios.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-020-cross-epic-scenarios/index.md
epic: EP-020
feature: FT-0205
---


# FT-0205 — Scenario spec and phase runner
Status: Completed (2026-03-07)

Пользовательская ценность: сценарии становятся исполнимыми asset-ами: их можно запускать, дебажить и изменять через fixtures без переписывания раннера.

Deliverables:
- `scenario.json`
- phase handlers in code
- file-based run state
- explicit `bindings.json`
- required/optional artifacts per phase
- assertions engine
- retry policy per phase (`fail_run` / `rerun_with_reset`)

Acceptance scenario:
- runner читает `scenario.json`
- выполняет phases последовательно
- сохраняет bindings/state/artifacts
- при ошибке фазы с policy `fail_run` run падает и сохраняет evidence

## Progress note (2026-03-07)
- Добавлены `packages/xe-runner/`, phase registry, file-based `state.json`/`bindings.json` и artifact manager.
- Runner исполняет `XE-001` по фазам, фиксирует assertions/artifacts и сохраняет failed runs для расследования вместо auto-delete.

## Quality checks evidence (2026-03-07)
- `pnpm --filter @feedback-360/xe-runner lint` → passed.
- `pnpm --filter @feedback-360/xe-runner typecheck` → passed.
- `pnpm --filter @feedback-360/xe-runner test` → passed.

## Acceptance evidence (2026-03-07)
- Automated:
  - `pnpm --filter @feedback-360/xe-runner exec vitest run src/ft-0205-scenarios.test.ts` → passed.
  - `pnpm --filter @feedback-360/cli cli -- xe runs run XE-001 --env local --owner codex --base-url http://127.0.0.1:3105 --json` → passed (`RUN-20260307121405-25bdb060`).
  - `pnpm --filter @feedback-360/cli cli -- xe runs run XE-001 --env beta --owner codex --base-url https://beta.go360go.ru --json` → passed (`RUN-20260307121525-c767edf3`).
- Covered acceptance:
  - runner последовательно проводит все 5 фаз;
  - state/bindings/artifacts сохраняются в workspace и достаточны для расследования;
  - failure policy `fail_run` больше не уничтожает run evidence.
- Artifacts:
  - beta run state.
    `[.memory-bank/evidence/EP-020/FT-0205/2026-03-07/beta-state.json](../../../../../evidence/EP-020/FT-0205/2026-03-07/beta-state.json)`
  - progress after questionnaire phase.
    `[.memory-bank/evidence/EP-020/FT-0205/2026-03-07/beta-progress.json](../../../../../evidence/EP-020/FT-0205/2026-03-07/beta-progress.json)`
