---
description: FT-0234-metadata-frontmatter-normalization feature plan for normalizing frontmatter and status conventions across memory-bank docs.
purpose: Read to align machine-readable metadata and reduce drift between legacy and current document patterns.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-023-documentation-traceability-hardening/index.md
epic: EP-023
feature: FT-0234
---

# FT-0234 — Metadata and frontmatter normalization
Status: Completed (2026-03-09)

## User value
Агенты и разработчики могут надёжно парсить и обновлять memory-bank без “угадывания”, какой документ живёт по старому формату, а какой — по новому.

## Deliverables
- Normalized frontmatter on required document classes.
- Clear rule for `status` representation and legacy `Status:` cleanup.
- Reduced ambiguity in `parent`, `epic`, `feature`, `scenario`, `screen_id`, `screen_ids` usage.

## Context (SSoT links)
- [Frontmatter standard](../../../../../mbb/frontmatter.md) — canonical metadata rules. Читать первым, чтобы normalization шёл от текущего стандарта.
- [Indexing standard](../../../../../mbb/indexing.md) — parent/index relationships. Читать, чтобы normalization не ломал navigation.

## Project grounding
- Inventory where frontmatter and legacy inline `Status:` currently coexist.
- Decide which classes of docs keep visible inline status and where frontmatter is enough.

## Implementation plan
- Normalize metadata in high-value sections first: plans, spec/ui, guides, mbb.
- Remove contradictory or duplicated status representations where reasonable.
- Keep migration incremental and predictable.

## Scenarios (auto acceptance)
### Setup
- No DB seed required.

### Action
1. Run metadata audit across `.memory-bank`.
2. Inspect a representative set of docs by category.

### Assert
- Required docs have valid frontmatter.
- Status conventions are consistent within each doc class.
- No broken `parent` chains in updated areas.

## Manual verification
- Open representative docs from `plans/`, `spec/`, `guides/`, `mbb/`; confirm metadata feels uniform and parseable.

## Tests
- `pnpm docs:audit`
- search/script evidence for normalized metadata classes


## Quality checks evidence (2026-03-09)
- `pnpm docs:audit`

## Acceptance evidence (2026-03-09)
- screen specs and key guides now carry canonical `description`, `purpose`, `status`, and `date` fields
- frontmatter rules are clarified in `mbb/frontmatter.md` and `spec/engineering/documentation-standards.md`
- governed doc classes are parseable with less legacy drift

## Docs updates (SSoT)
- `mbb/frontmatter.md`
- affected docs across `.memory-bank/`
