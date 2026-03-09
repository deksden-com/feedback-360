---
description: FT-0231-code-to-doc-jsdoc-rollout feature plan for rolling out @docs and @see across key entrypoints.
purpose: Read when implementing or auditing this slice so code-level navigation to SSoT is rolled out consistently.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-023-documentation-traceability-hardening/index.md
epic: EP-023
feature: FT-0231
---

# FT-0231 — Code-to-doc JSDoc rollout
Status: Completed (2026-03-09)

## User value
Разработчик или AI-агент открывает ключевой entrypoint и сразу видит, какой документ является нормативным, а какие смежные документы/ADR/планы стоит прочитать перед изменением кода.

## Deliverables
- `@docs` / `@see` на route-level screens в `apps/web/src/app/*`.
- `@docs` / `@see` на owning modules в `packages/core/src/features/*`.
- `@docs` / `@see` на feature-level client/CLI entrypoints.
- Updated coding/documentation standards with concrete rollout examples where needed.

## Context (SSoT links)
- [Cross-references](../../../../../mbb/cross-references.md) — canonical rule for docs ↔ code navigation. Читать первым, чтобы rollout не придумывал локальный формат.
- [Coding style](../../../../../spec/engineering/coding-style.md) — JSDoc conventions already active for UI. Читать, чтобы rollout расширял existing style, а не конфликтовал с ним.
- [Feature-area boundaries](../../../../../spec/project/feature-area-boundaries.md) — feature-area owning modules. Читать, чтобы ставить `@docs` именно на правильные composition points.

## Project grounding
- Inventory route pages and main feature-area entrypoints.
- Separate “must annotate now” files from low-level helpers/components.
- Confirm existing SSoT documents for each annotated surface before editing code.

## Implementation plan
- Add `@docs` / `@see` to all route-level pages.
- Add `@docs` / `@see` to `packages/core`, `packages/client`, `packages/cli` feature entrypoints.
- Keep annotations concise and stable; avoid noisy links on low-level helpers.

## Scenarios (auto acceptance)
### Setup
- No DB seed required.

### Action
1. Search codebase for `@docs` / `@see`.
2. Inspect route-level pages and key feature entrypoints.

### Assert
- Key route-level pages include `@docs`.
- Key feature-area owning modules include `@docs`.
- `@see` points to closely related docs/tests, not random broad indexes.

## Manual verification
- Open a route-level page and one core feature entrypoint; confirm a new contributor can navigate from code to the right SSoT file without searching manually.

## Tests
- Repo search based audit command recorded in evidence.
- Extended traceability audit script when FT-0236 lands.


## Quality checks evidence (2026-03-09)
- `pnpm docs:audit`
- `pnpm --filter @feedback-360/web lint`
- `pnpm --filter @feedback-360/web typecheck`
- `pnpm --filter @feedback-360/core typecheck`
- `pnpm --filter @feedback-360/client typecheck`
- `pnpm --filter @feedback-360/cli typecheck`

## Acceptance evidence (2026-03-09)
- `rg -L "@docs" apps/web/src/app/**/page.tsx` returns no route pages
- `rg -L "@docs" packages/core/src/features/*.ts packages/client/src/features/*.ts packages/cli/src/index.ts packages/cli/src/legacy.ts packages/cli/src/auth-provisioning.ts` returns no missing entrypoints
- code navigation now points directly to normative specs instead of only broad indexes

## Docs updates (SSoT)
- `spec/engineering/coding-style.md`
- `mbb/cross-references.md`
- relevant subsystem/spec docs when linked from code for the first time
