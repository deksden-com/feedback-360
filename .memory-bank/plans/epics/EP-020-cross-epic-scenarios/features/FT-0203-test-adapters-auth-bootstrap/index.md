---
description: FT-0203-test-adapters-auth-bootstrap feature plan and evidence entry for EP-020-cross-epic-scenarios.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-020-cross-epic-scenarios/index.md
epic: EP-020
feature: FT-0203
---


# FT-0203 — Test adapters and auth bootstrap
Status: Completed (2026-03-07)

Пользовательская ценность: сценарий может проверять notification intents и быстро логинить actors без внешней почты/Telegram и без ручного GUI-login.

Deliverables:
- notification test adapter
- controlled async stubs for XE
- short-lived test-only auth bootstrap for `local`/`beta`
- audit trail for token/session issuance

Acceptance scenario:
- campaign start создаёт notification intents в test adapter
- раннер может получить auth bootstrap для `subject`
- браузер получает обычную session и открывает защищённый экран
- logout завершает текущую session обычным путём

## Progress note (2026-03-07)
- XE runner использует notification intents как проверяемый test-adapter surface и test-only storage-state bootstrap для actor sessions на `local|beta`.
- Для сценариев каждая actor session создаётся отдельно и потом живёт как обычная product session.
- Для ручной beta-проверки добавлен XE token login: CLI выпускает short-lived signed token, login page принимает его только в `local|beta`.

## Quality checks evidence (2026-03-07)
- `pnpm --filter @feedback-360/xe-runner lint` → passed.
- `pnpm --filter @feedback-360/xe-runner typecheck` → passed.
- `pnpm --filter @feedback-360/xe-runner test` → passed.
- `pnpm --filter @feedback-360/cli test` → passed.

## Acceptance evidence (2026-03-07)
- Automated:
  - `pnpm --filter @feedback-360/cli exec vitest run src/ft-0204-xe-cli.test.ts` → passed.
  - `pnpm --filter @feedback-360/cli cli -- xe runs run XE-001 --env beta --owner codex --base-url https://beta.go360go.ru --json` → passed (`RUN-20260307121525-c767edf3`).
- Covered acceptance:
  - `campaign.start` создаёт invite intents, которые видны раннеру;
  - `xe auth issue ... --format storage-state` создаёт usable browser session для actor;
  - `xe auth issue ... --format token` даёт manual login path для beta-проверки;
  - actor screen открывается без GUI magic-link flow.
- Artifacts:
  - notifications snapshot.
    `[.memory-bank/evidence/EP-020/FT-0203/2026-03-07/beta-notifications.json](../../../../../evidence/EP-020/FT-0203/2026-03-07/beta-notifications.json)`
  - session bootstrap snapshot.
    `[.memory-bank/evidence/EP-020/FT-0203/2026-03-07/beta-sessions.json](../../../../../evidence/EP-020/FT-0203/2026-03-07/beta-sessions.json)`
