---
description: FT-0223-workspace-shell-dashboards feature plan and evidence entry for EP-022-visual-system-rollout.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-022-visual-system-rollout/index.md
epic: EP-022
feature: FT-0223
---


# FT-0223 — Workspace shell and dashboards
Status: Completed (2026-03-08)

## User value
Внутреннее приложение ощущается как единое рабочее пространство: shell, navigation, account chrome и dashboards помогают быстро понять, что происходит и что делать дальше.

## Deliverables
- Unified shell v2 for internal routes.
- Dashboard/home surfaces aligned to the new baseline.
- Cleaner account/company chrome and utility top bar.

## Starting point
- `SCR-APP-HOME` уже частично выровнен под новый baseline и используется как anchor screen.
- Эта фича доводит shell и surrounding dashboard chrome до полноценной system-level консистентности.

## Context (SSoT links)
- [Visual baseline v2](../../../../../spec/ui/design-system/visual-baseline-v2.md)
- [Screen-by-screen redesign](../../../../../spec/ui/screen-by-screen-redesign.md)
- [EP-011 App shell and navigation](../../../EP-011-app-shell-navigation/index.md)

## Quality checks evidence (2026-03-08)
- `pnpm --filter @feedback-360/web lint` → passed
- `pnpm --filter @feedback-360/web typecheck` → passed
- `pnpm --filter @feedback-360/web build` → passed

## Acceptance evidence (2026-03-08)
- Live local screenshot:
  - `../../../../../evidence/EP-022/FT-0223/2026-03-08/step-01-home-dashboard__(SCR-APP-HOME).png`
- The refreshed dashboard also replaces the tutorial asset:
  - `../../../../../guides/assets/manual-first-campaign/step-01-hr-home__(SCR-APP-HOME).png`
