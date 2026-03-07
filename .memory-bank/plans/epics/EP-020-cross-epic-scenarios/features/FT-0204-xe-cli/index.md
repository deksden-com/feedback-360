# FT-0204 — XE CLI
Status: Completed (2026-03-07)

Пользовательская ценность: AI-агент и разработчик управляют сценариями через единый CLI без ручной сборки вспомогательных команд.

Deliverables:
- `xe scenarios list/show`
- `xe runs create/start/run/status/resume/delete`
- `xe seeds apply/inspect`
- `xe assertions run`
- `xe artifacts dir/export`
- `xe lock status/release --force`
- `xe auth issue`
- `xe notifications list`

Acceptance scenario:
- `xe runs run XE-001 --json` создаёт run и начинает execution
- `xe runs status <run-id>` возвращает phase/status summary
- `xe artifacts dir <run-id>` возвращает путь workspace
- `xe runs delete <run-id>` очищает run

## Progress note (2026-03-07)
- CLI получил команды для scenario catalog, runs, phases, seeds, auth bootstrap, artifacts, notifications и lock management.
- XE CLI стал основным surface для агента: сценарий можно создать, запустить, исследовать и почистить без ad-hoc команд.

## Quality checks evidence (2026-03-07)
- `pnpm --filter @feedback-360/cli lint` → passed.
- `pnpm --filter @feedback-360/cli typecheck` → passed.
- `pnpm --filter @feedback-360/cli test` → passed.

## Acceptance evidence (2026-03-07)
- Automated:
  - `pnpm --filter @feedback-360/cli exec vitest run src/ft-0204-xe-cli.test.ts` → passed.
  - `pnpm --filter @feedback-360/cli cli -- xe runs run XE-001 --env beta --owner codex --base-url https://beta.go360go.ru --json` → passed.
- Covered acceptance:
  - `xe scenarios list/show` возвращают catalog и spec metadata;
  - `xe runs run/status/list` отражают актуальный phase progression;
  - `xe lock status/release --force`, `xe auth issue`, `xe notifications list`, `xe artifacts dir` доступны в одном CLI surface.
- Artifacts:
  - scenario snapshot from executed run.
    `[.memory-bank/evidence/EP-020/FT-0204/2026-03-07/scenario.json](../../../../../evidence/EP-020/FT-0204/2026-03-07/scenario.json)`
