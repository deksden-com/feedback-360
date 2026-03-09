---
description: Quick reference for opening XE scenario surfaces on beta with helper scripts and token login.
purpose: Read when you need the shortest path to beta XE access without walking through the full scenario docs.
status: Active
date: 2026-03-09
parent: .memory-bank/guides/reference/index.md
screen_ids:
  - SCR-AUTH-LOGIN
  - SCR-RESULTS-EMPLOYEE
  - SCR-RESULTS-MANAGER
  - SCR-RESULTS-HR
---

# XE beta access — quick reference
Status: Active (2026-03-09)

## Fast path
- run one of the helper scripts under `scenarios/XE-001/scripts/`;
- open `/auth/login`;
- use the XE token helper;
- continue to the target result screen.

## Common helpers
- `./scenarios/XE-001/scripts/subject-token.sh`
- `./scenarios/XE-001/scripts/manager-token.sh`
- `./scenarios/XE-001/scripts/hr-admin-token.sh`

## Typical target screens
- subject → `/results`
- manager → `/results/team`
- hr_admin → `/results/hr`

## Related docs
- [Open XE-001 results on beta](../how-to/open-xe-001-results-on-beta.md) — full step-by-step how-to.
- [XE scenario catalog](../../plans/xe/index.md) — scenario context and available runs.
