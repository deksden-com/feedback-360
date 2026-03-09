---
description: FT-0232-screen-specs-completion feature plan for completing and deepening route-level screen specs.
purpose: Read to align screen contracts, routes, actions, domain states, and UI traceability under one consistent template.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-023-documentation-traceability-hardening/index.md
epic: EP-023
feature: FT-0232
---

# FT-0232 — Screen specs completion and deepening
Status: Completed (2026-03-09)

## User value
Команда может редизайнить, тестировать и автоматизировать UI без догадок: каждый экран описан одинаково и достаточно глубоко, чтобы понять содержимое, действия, состояния и доменные ограничения.

## Deliverables
- Screen specs for all route-level screens from `screen-registry.md`.
- Unified template sections:
  - purpose;
  - route/actors;
  - information blocks;
  - primary and secondary actions;
  - states (loading/empty/error/read-only/etc.);
  - domain-specific behavior and constraints;
  - linked implementation/tests.

## Context (SSoT links)
- [Screen registry](../../../../../spec/ui/screen-registry.md) — canonical list of route-level screens and gaps. Читать, чтобы completion шёл от реестра, а не от случайно выбранных экранов.
- [UI automation contract](../../../../../spec/testing/ui-automation-contract.md) — screen specs should align with POM and automation boundaries. Читать, чтобы docs помогали tests, а не жили отдельно.
- [Redesign screen catalog](../../../../../spec/ui/redesign-screen-catalog.md) — rich screen content inventory. Читать, чтобы углублять screen specs не с нуля.

## Project grounding
- Compare current route pages, screen registry, screen docs, and POM references.
- Identify which screens are still `planned` in registry despite already existing in code.

## Implementation plan
- Fill missing screen specs first.
- Then deepen existing shallow specs with the shared template.
- Link each screen spec to owning code path and primary Playwright coverage where available.

## Scenarios (auto acceptance)
### Setup
- No DB seed required.

### Action
1. Enumerate route-level screens from registry.
2. Enumerate screen spec files.
3. Validate each spec has mandatory sections.

### Assert
- No route-level screen remains “planned” without a corresponding screen spec when code already exists.
- Screen specs include actions, states, and domain behavior sections.
- Screen specs reference `screen_id` and `testIdScope` consistently.

## Manual verification
- Pick at least one auth screen, one CRUD screen, one questionnaire/results screen; confirm the spec is enough to brief a designer or QA without opening code first.

## Tests
- Docs audit plus search/script evidence.
- Extended traceability audit in FT-0236.


## Quality checks evidence (2026-03-09)
- `pnpm docs:audit`

## Acceptance evidence (2026-03-09)
- `screen-registry.md` no longer contains coded route screens marked as `planned`
- all route-level screens now have screen spec docs with route, actors, information blocks, actions, states, and domain behavior sections
- screen specs link to owning implementation files and primary tests

## Docs updates (SSoT)
- `spec/ui/screens/*`
- `spec/ui/screen-registry.md`
- related POM docs if mappings become explicit
