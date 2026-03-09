---
description: FT-0222-auth-entry-surfaces feature plan and evidence entry for EP-022-visual-system-rollout.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-022-visual-system-rollout/index.md
epic: EP-022
feature: FT-0222
---


# FT-0222 — Auth and entry surfaces
Status: Completed (2026-03-08)

## User value
Пользователь получает чистый, современный и понятный вход в систему: login, company selection и related entry states выглядят как зрелый SaaS entry flow, а не как технический экран.

## Deliverables
- Redesigned `SCR-AUTH-LOGIN`.
- Redesigned `SCR-COMPANY-SWITCHER`.
- Harmonized empty/loading/error states for entry flows.

## Context (SSoT links)
- [Visual baseline v2](../../../../../spec/ui/design-system/visual-baseline-v2.md)
- [Screen registry](../../../../../spec/ui/screen-registry.md)
- [UI screen catalog](../../../../../spec/ui/redesign-screen-catalog.md)

## Quality checks evidence (2026-03-08)
- `pnpm --filter @feedback-360/web lint` → passed
- `pnpm --filter @feedback-360/web typecheck` → passed
- `pnpm --filter @feedback-360/web build` → passed
- `pnpm docs:audit` → passed

## Acceptance evidence (2026-03-08)
- Live local screenshots:
  - `../../../../../evidence/EP-022/FT-0222/2026-03-08/step-01-login__(SCR-AUTH-LOGIN).png`
  - `../../../../../evidence/EP-022/FT-0222/2026-03-08/step-02-company-switcher__(SCR-COMPANY-SWITCHER).png`
- Updated guide screenshots:
  - `../../../../../guides/assets/manual-first-campaign/step-01a-login__(SCR-AUTH-LOGIN).png`
  - `../../../../../guides/assets/manual-first-campaign/step-01b-company-switcher__(SCR-COMPANY-SWITCHER).png`
