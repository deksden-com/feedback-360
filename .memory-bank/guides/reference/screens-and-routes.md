---
description: Quick reference for the main application screens and routes.
purpose: Read when you need a short lookup for where a surface lives without opening the full screen registry.
status: Active
date: 2026-03-09
parent: .memory-bank/guides/reference/index.md
screen_ids:
  - SCR-AUTH-LOGIN
  - SCR-COMPANY-SWITCHER
  - SCR-APP-HOME
  - SCR-HR-EMPLOYEES
  - SCR-HR-ORG
  - SCR-HR-MODELS
  - SCR-HR-CAMPAIGNS
  - SCR-QUESTIONNAIRES-INBOX
  - SCR-QUESTIONNAIRES-FILL
  - SCR-RESULTS-EMPLOYEE
  - SCR-RESULTS-MANAGER
  - SCR-RESULTS-HR
---

# Screens and routes — quick reference
Status: Active (2026-03-09)

## Auth and entry
- `SCR-AUTH-LOGIN` → `/auth/login`
- `SCR-AUTH-CALLBACK` → `/auth/callback`
- `SCR-COMPANY-SWITCHER` → `/select-company`

## Workspace
- `SCR-APP-HOME` → `/`

## HR
- `SCR-HR-EMPLOYEES` → `/hr/employees`
- `SCR-HR-EMPLOYEE-DETAIL` → `/hr/employees/[employeeId]`
- `SCR-HR-ORG` → `/hr/org`
- `SCR-HR-MODELS` → `/hr/models`
- `SCR-HR-CAMPAIGNS` → `/hr/campaigns`
- `SCR-HR-NOTIFICATIONS` → `/hr/notifications`
- `SCR-OPS` → `/ops`

## Questionnaires and results
- `SCR-QUESTIONNAIRES-INBOX` → `/questionnaires`
- `SCR-QUESTIONNAIRES-FILL` → `/questionnaires/[questionnaireId]`
- `SCR-RESULTS-EMPLOYEE` → `/results`
- `SCR-RESULTS-MANAGER` → `/results/team`
- `SCR-RESULTS-HR` → `/results/hr`

## Related specs
- [Screen registry](../../spec/ui/screen-registry.md) — canonical and complete screen list with `testIdScope`.
- [UI screen specs](../../spec/ui/screens/index.md) — richer per-screen contracts.
