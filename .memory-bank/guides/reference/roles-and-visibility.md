---
description: Quick reference for roles and what each role can see in feedback-360.
purpose: Read when you need a short lookup for user-facing visibility without opening deep RBAC and results specs.
status: Active
date: 2026-03-09
parent: .memory-bank/guides/reference/index.md
---

# Roles and visibility — quick reference
Status: Active (2026-03-09)

## Roles
- `HR Admin`: полный HR operational доступ, включая raw comments where policy allows.
- `HR Reader`: read-only HR access without raw-only/destructive capabilities.
- `Manager`: team/results visibility within manager scope.
- `Employee`: own questionnaires and own results.

## Results visibility
- `Employee`: агрегаты + processed/summary text only.
- `Manager`: team-safe results with anonymity/hidden-group rules applied.
- `HR Admin`: progress + aggregates + raw/processed/summary text.
- `HR Reader`: progress + aggregates + processed/summary text, but no raw text.

## Questionnaire visibility
- questionnaire assignee can open and fill assigned questionnaires;
- after submit or after campaign end, the questionnaire becomes read-only.

## Related specs
- [RBAC](../../spec/security/rbac.md) — normative role/action matrix.
- [Results visibility](../../spec/domain/results-visibility.md) — normative rules for what each role sees in results.
- [Auth and identity](../../spec/security/auth-and-identity.md) — who can enter the system and how identities are linked.
