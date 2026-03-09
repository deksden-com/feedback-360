---
description: FT-0221-design-system-v2-foundations feature plan and evidence entry for EP-022-visual-system-rollout.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-022-visual-system-rollout/index.md
epic: EP-022
feature: FT-0221
---


# FT-0221 — Design system v2 foundations
Status: Completed (2026-03-08)

## User value
Пользователь видит единый продукт, а не набор страниц разных эпох: типографика, отступы, рамки, CTA и status semantics становятся предсказуемыми на всех ключевых routes.

## Deliverables
- Updated design tokens and typography rules.
- Visual baseline v2 anchored in `login` / `dashboard` / `questionnaire`.
- Component usage rules revised for cards, headers, toolbars, feeds, forms and report blocks.

## Context (SSoT links)
- [Visual baseline v2](../../../../../spec/ui/design-system/visual-baseline-v2.md)
- [Theme tokens](../../../../../spec/ui/design-system/tokens.md)
- [Component usage rules](../../../../../spec/ui/design-system/component-usage.md)
- [UI design principles](../../../../../spec/ui/design-principles.md)

## Quality checks evidence (2026-03-08)
- `pnpm docs:audit` → passed after baseline refresh.

## Acceptance evidence (2026-03-08)
- Tokens, baseline and component rules updated in:
  - `../../../../../spec/ui/design-system/visual-baseline-v2.md`
  - `../../../../../spec/ui/design-system/tokens.md`
  - `../../../../../spec/ui/design-system/component-usage.md`
  - `../../../../../spec/ui/design-principles.md`
- Already-ready anchor screens explicitly captured in the epic:
  - `SCR-APP-HOME`
  - `SCR-QUESTIONNAIRES-FILL`
