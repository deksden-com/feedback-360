---
description: FT-0233-docs-to-code-ownership-links feature plan for adding owning implementation and test links to priority docs.
purpose: Read to strengthen navigation from SSoT docs to real implementation and verification paths.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-023-documentation-traceability-hardening/index.md
epic: EP-023
feature: FT-0233
---

# FT-0233 — Docs-to-code ownership links
Status: Completed (2026-03-09)

## User value
Из ключевого документа можно быстро перейти к реальной реализации и тестам, не проводя ручное расследование по всему репозиторию.

## Deliverables
- Priority subsystem/spec docs include owning code paths.
- Priority feature/screen docs include primary test paths.
- `implementation_files` / `test_files` or equivalent explicit sections are used in live docs, not only in templates.

## Context (SSoT links)
- [Cross-references](../../../../../mbb/cross-references.md) — docs → code rules. Читать, чтобы links were meaningful and not decorative.
- [Documentation standards](../../../../../spec/engineering/documentation-standards.md) — where code links belong and where they should stay out. Читать, чтобы не тащить implementation noise в pure user-facing guides.
- [Traceability](../../../../../spec/testing/traceability.md) — requirements to tests mapping. Читать, чтобы ownership links усиливали verification story, а не жили отдельно.

## Project grounding
- Prioritize docs that are read during implementation:
  - domain specs;
  - client-api specs;
  - UI screen specs;
  - epic/feature docs for active areas.

## Implementation plan
- Add owning implementation and test links to high-value docs first.
- Prefer explicit, minimal ownership over exhaustive file dumps.
- Keep user-facing guides lightweight; link code there only when operator/developer value is clear.

## Scenarios (auto acceptance)
### Setup
- No DB seed required.

### Action
1. Inspect representative spec/plan docs.
2. Verify they contain owning implementation or test references.

### Assert
- Priority docs no longer rely only on prose and abstract links.
- Owning code/test paths are stable and useful.
- Templates and live docs are aligned.

## Manual verification
- Open one domain spec, one screen spec, one feature doc; confirm you can jump from doc to implementation/test without repo-wide search.

## Tests
- Search-based audit evidence.
- Follow-up automation in FT-0236.


## Quality checks evidence (2026-03-09)
- `pnpm docs:audit`

## Acceptance evidence (2026-03-09)
- domain/auth/notifications specs now point to owning code and primary tests
- screen specs use `implementation_files` and `test_files` in live docs, not only templates
- maintainers can jump from spec to code/test without repo-wide search

## Docs updates (SSoT)
- priority docs under `spec/`, `plans/`, `spec/ui/screens/`
- `mbb/frontmatter.md` if live usage clarifies field conventions
