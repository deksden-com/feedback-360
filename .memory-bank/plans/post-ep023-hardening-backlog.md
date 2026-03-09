---
description: Short post-EP-023 backlog for the next documentation and traceability hardening wave.
purpose: Read to see the highest-value follow-up improvements after EP-023 without turning them into a full new epic prematurely.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/index.md
---

# Post-EP-023 hardening backlog
Status: Active (2026-03-09)

## Purpose
Зафиксировать короткий, practical backlog после завершения `EP-023`, чтобы не потерять следующие улучшения качества документации и трассируемости, но и не раздувать сразу новый большой эпик без необходимости.

## When to use this backlog
- после завершения продуктовых EP, если нужен короткий quality sprint;
- перед расширением audit automation;
- когда видно, что `docs → code → tests → evidence` уже хорошие, но ещё не полностью системные;
- когда нужно выбрать следующий маленький hardening slice без долгого перепланирования.

## Priority items

### 1. Deepen `@docs` / `@see` below entrypoint level
**Goal**
- раскатить doc-links глубже, чем route pages и feature roots: на важные orchestration components, screen-level containers и high-value reusable UI surfaces.

**Why it matters**
- сейчас strongest coverage есть на entrypoints, но внутри feature areas некоторые важные composition points всё ещё требуют manual search.

**Likely targets**
- `apps/web/src/features/*/components/*`
- `apps/web/src/features/*/lib/*`
- selected server-side adapters and orchestration modules

**Acceptance**
- для каждого high-value feature area есть хотя бы один documented composition point ниже entrypoint level;
- contributor может открыть важный component/container и сразу выйти к screen spec или subsystem spec.

### 2. Expand docs → code/test ownership links
**Goal**
- довести `implementation_files` / `test_files` до большего числа domain/client-api/security/ops docs.

**Why it matters**
- сейчас priority docs покрыты хорошо, но ownership links ещё не стали pervasive habit.

**Likely targets**
- `spec/domain/*`
- `spec/client-api/*`
- `spec/operations/*`
- `spec/testing/*`

**Acceptance**
- новые ownership links не выглядят как noisy dumps;
- high-value docs помогают быстро найти owning code и primary tests.

### 3. Strengthen screen/test-id/screenshot consistency checks
**Goal**
- расширить automated checks на naming consistency между `screen_id`, `testIdScope`, `data-testid` roots и screenshot filenames.

**Why it matters**
- после rollout screen ids и visual system важно ловить drift между UI docs, code and evidence automatically.

**Likely checks**
- root `data-testid` exists for route-level surfaces with `testIdScope`;
- screenshot filenames in governed guides/evidence follow `__(SCR-...)`;
- screen ids referenced in guides exist in registry.

**Acceptance**
- `docs:audit` or a companion traceability check catches these drifts before merge.

### 4. Grow `guides/reference` into operator handbook
**Goal**
- добавить ещё несколько short-form lookup docs поверх already useful reference layer.

**Why it matters**
- operators and new contributors now have a good start, but still need a quicker way to answer recurring runtime questions.

**Candidate reference docs**
- campaign editability and freeze rules
- result visibility matrix by role and group
- XE run lifecycle and cleanup shortcuts
- notification/outbox quick troubleshooting
- beta/prod access and verification shortcuts

**Acceptance**
- common “how do I quickly check X?” questions answerable from `guides/reference/` in one or two clicks.

## Suggested execution order
1. deepen `@docs` / `@see`
2. expand docs → code/test ownership links
3. strengthen automated consistency checks
4. grow `guides/reference`

## Escalation rule
Если этот backlog начинает разрастаться больше чем в 4–5 связанных slices или требует новые acceptance rules/CI lanes, его нужно перевести в полноценный epic вместо продолжения ad-hoc cleanup.

## Related docs
- [EP-023 Documentation traceability and SSoT hardening](epics/EP-023-documentation-traceability-hardening/index.md) — completed baseline for current traceability system. Читать сначала, чтобы follow-up backlog опирался на уже закрытую волну, а не дублировал её.
- [Verification matrix](verification-matrix.md) — где фиксируются доказательства completed hardening slices. Читать, если любой backlog item превращается в отдельную FT или mini-epic.
- [Cross-references](../mbb/cross-references.md) — canonical docs ↔ code navigation rule. Читать, если выбираем следующий slice по `@docs`, `@see`, ownership links или traceability audit.
- [UI automation contract](../spec/testing/ui-automation-contract.md) — screen/test-id/POM contracts. Читать, если follow-up backlog идёт в сторону UI traceability and evidence consistency.
