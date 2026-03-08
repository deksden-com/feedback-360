# FT-0224 — HR CRUD and campaign surfaces
Status: Completed (2026-03-08)

## User value
HR-admin работает с сотрудниками, оргструктурой, моделями и кампаниями через привычные SaaS admin screens: понятные toolbar, resource rows/cards, hierarchy details и action hierarchy.

## Deliverables
- Redesigned employees/org/models/campaigns list/detail screens.
- Better hierarchy/readability for org and campaign operational detail.
- Matrix/detail surfaces aligned with the same visual system.

## Context (SSoT links)
- [Visual baseline v2](../../../../../spec/ui/design-system/visual-baseline-v2.md)
- [Component usage rules](../../../../../spec/ui/design-system/component-usage.md)
- [Screen registry](../../../../../spec/ui/screen-registry.md)

## Quality checks evidence (2026-03-08)
- `pnpm --filter @feedback-360/web lint` → passed
- `pnpm --filter @feedback-360/web typecheck` → passed
- `pnpm --filter @feedback-360/web build` → passed

## Acceptance evidence (2026-03-08)
- Live local screenshots:
  - `../../../../../evidence/EP-022/FT-0224/2026-03-08/step-01-employees__(SCR-HR-EMPLOYEES).png`
  - `../../../../../evidence/EP-022/FT-0224/2026-03-08/step-02-org__(SCR-HR-ORG).png`
  - `../../../../../evidence/EP-022/FT-0224/2026-03-08/step-03-models__(SCR-HR-MODELS).png`
  - `../../../../../evidence/EP-022/FT-0224/2026-03-08/step-04-campaigns__(SCR-HR-CAMPAIGNS).png`
  - `../../../../../evidence/EP-022/FT-0224/2026-03-08/step-05-campaign-detail__(SCR-HR-CAMPAIGN-DETAIL).png`
