---
description: FT-0226-screenshot-guide-refresh feature plan and evidence entry for EP-022-visual-system-rollout.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-022-visual-system-rollout/index.md
epic: EP-022
feature: FT-0226
---


# FT-0226 — Screenshot and guide refresh
Status: Completed (2026-03-08)

## User value
Документация, handoff и evidence показывают реальный актуальный продукт, а не устаревший UI.

## Deliverables
- Refreshed guides screenshots.
- Refreshed evidence screenshots for materially changed screens.
- Updated redesign handoff docs.

## Context (SSoT links)
- [Screen registry](../../../../../spec/ui/screen-registry.md)
- [MBB indexing rules](../../../../../mbb/indexing.md)
- [Guides index](../../../../../guides/index.md)

## Quality checks evidence (2026-03-08)
- `pnpm docs:audit` → passed

## Acceptance evidence (2026-03-08)
- `../../../../../guides/tutorials/run-first-360-campaign-manually.md` updated with the new login/company/home sequence.
- Entry screenshots copied into `../../../../../guides/assets/manual-first-campaign/`.
- EP-022 evidence folders populated for auth, shell, HR CRUD and questionnaire/results rollout.
