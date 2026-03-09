---
description: FT-0236-traceability-audit-automation feature plan for extending automated checks around documentation traceability and ownership links.
purpose: Read to make documentation quality regressions detectable before merge.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-023-documentation-traceability-hardening/index.md
epic: EP-023
feature: FT-0236
---

# FT-0236 — Traceability audit automation
Status: Completed (2026-03-09)

## User value
Качество документации перестаёт зависеть только от ручной дисциплины: ключевые traceability drifts ловятся автоматически до merge.

## Deliverables
- Extended audit checks for:
  - route-level `@screenId` / `@testIdScope`;
  - route-level `@docs` coverage policy;
  - screen-registry vs screen-spec coverage;
  - high-value docs ownership links presence;
  - required frontmatter on governed doc classes.
- Documented commands and CI hooks where appropriate.

## Context (SSoT links)
- [Indexing standard](../../../../../mbb/indexing.md) — governed doc classes and navigation rules. Читать, чтобы automation проверяла именно обязательные зоны.
- [Cross-references](../../../../../mbb/cross-references.md) — target state for docs ↔ code navigation. Читать, чтобы audits проверяли meaningful rules.
- [Delivery standards](../../../../../spec/engineering/delivery-standards.md) — release/feature closeout discipline. Читать, чтобы новые audits встроились в normal completion gate.

## Project grounding
- Review current `pnpm docs:audit` and `scripts/audit-memory-bank.mjs`.
- Separate “must fail CI” rules from “advisory/warn first” rules.

## Implementation plan
- Extend existing audit tooling instead of adding a parallel checker.
- Add high-signal rules first.
- Record examples and remediation guidance in docs.

## Scenarios (auto acceptance)
### Setup
- No DB seed required.

### Action
1. Run extended docs audit on current repo.
2. Intentionally review representative docs/code for expected hits.

### Assert
- Audit detects missing required links/coverage in governed areas.
- Audit passes on corrected docs.
- Output is readable enough for contributors to fix issues quickly.

## Manual verification
- Run audit locally and verify that a contributor can understand what to fix from output alone.

## Tests
- `pnpm docs:audit`
- targeted script tests if audit logic grows enough to justify them


## Quality checks evidence (2026-03-09)
- `pnpm docs:audit`
- `node scripts/audit-memory-bank.mjs --ep EP-023`

## Acceptance evidence (2026-03-09)
- audit now checks `@docs` coverage, screen-registry vs screen-spec parity, required frontmatter, and ownership links
- default `pnpm docs:audit` output is actionable and machine-readable
- traceability drift is now caught before merge instead of by manual reading

## Docs updates (SSoT)
- `spec/engineering/delivery-standards.md`
- `mbb/cross-references.md`
- `mbb/frontmatter.md`
- `mbb/indexing.md`
