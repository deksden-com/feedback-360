---
description: FT-0235-guides-reference-completion feature plan for strengthening user/operator lookup docs and guide completeness.
purpose: Read to close obvious guide/reference gaps without duplicating internal specs.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-023-documentation-traceability-hardening/index.md
epic: EP-023
feature: FT-0235
---

# FT-0235 — Guides and reference completion
Status: Completed (2026-03-09)

## User value
Появляется быстрый lookup-layer для пользователей и операторов: роли, статусы, экраны и основные рабочие действия можно найти без чтения глубоких specs.

## Deliverables
- `guides/reference/` with initial useful docs:
  - roles and visibility;
  - campaign statuses;
  - screen/route quick reference;
  - XE/beta access quick reference where appropriate.
- Better cross-linking between tutorials/how-to/explanation/reference.

## Context (SSoT links)
- [Guides index](../../../../../guides/index.md) — current Diátaxis split. Читать, чтобы completion усиливал guides as user-facing docs, not as duplicate spec.
- [Glossary](../../../../../spec/glossary.md) — user-facing terminology baseline. Читать, чтобы reference docs использовали consistent terms.
- [System overview](../../../../../spec/project/system-overview.md) — product/role context. Читать, чтобы reference docs оставались aligned with MVP scope.

## Project grounding
- Review what operators/users currently have to discover by reading deeper specs.
- Reuse existing guide/tutorial content where possible instead of duplicating.

## Implementation plan
- Start with role/status/screen quick refs.
- Add only high-value lookup docs; keep them short and link-heavy.
- Cross-link tutorials/how-to/reference around shared surfaces and roles.

## Scenarios (auto acceptance)
### Setup
- No DB seed required.

### Action
1. Inspect `guides/reference/`.
2. Verify the expected quick-reference docs exist and are linked from guides index.

### Assert
- `guides/reference/` is no longer an empty placeholder.
- Reference docs use `screen_id` / `screen_ids` where UI surfaces are involved.
- Reference docs point back to normative specs instead of duplicating them.

## Manual verification
- Ask: “I need to remember campaign statuses or which role sees what” — confirm answer is reachable from `guides/index.md` in one or two clicks.

## Tests
- `pnpm docs:audit`
- manual navigation evidence captured in feature closeout


## Quality checks evidence (2026-03-09)
- `pnpm docs:audit`

## Acceptance evidence (2026-03-09)
- `guides/reference/` now contains role visibility, campaign statuses, screens/routes, and XE beta access quick refs
- guides index links users/operators to reference docs in one hop
- reference docs point back to normative specs instead of duplicating them

## Docs updates (SSoT)
- `guides/reference/*`
- `guides/index.md`
- maybe related explanation/how-to docs when navigation improves
