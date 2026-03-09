---
description: Quick reference for who can see which result surfaces, texts, and anonymity-sensitive groups.
purpose: Read when you need a compact matrix of result visibility by role and group without opening full privacy specs.
status: Active
date: 2026-03-09
parent: .memory-bank/guides/reference/index.md
screen_ids:
  - SCR-RESULTS-EMPLOYEE
  - SCR-RESULTS-MANAGER
  - SCR-RESULTS-HR
---

# Results visibility matrix — quick reference
Status: Active (2026-03-09)

## By role
- `Employee`: own dashboard only; sees aggregates and processed/summary text, never raw comments.
- `Manager`: team-safe dashboard; sees manager-scoped aggregates and anonymity-safe comments only.
- `HR Admin`: full HR results surface; sees aggregates plus raw and processed text where policy allows.
- `HR Reader`: HR results surface without destructive controls; sees processed/summary text, not raw-only HR-admin data.

## Group visibility
- `manager`: always shown as a named group, never anonymized.
- `self`: always shown separately, but weight is `0%` in overall score.
- `peers` / `subordinates`: shown only when threshold is met; otherwise hidden or merged according to policy.
- `other`: used only when the policy merges small groups.

## Model-specific note
- `indicators`: UI may show score summaries and averages.
- `levels`: UI should emphasize mode and distribution; do not present “average level” as the primary headline.

## Related specs
- [Results visibility](../../spec/domain/results-visibility.md) — normative role-based visibility rules.
- [Anonymity policy](../../spec/domain/anonymity-policy.md) — threshold, merge, and hidden-group rules.
- [Calculations](../../spec/domain/calculations.md) — indicator vs level presentation semantics.
