---
description: Sentry example screen contract for developer-facing observability verification.
purpose: Read before changing the debug-only Sentry example surface or related observability docs.
status: Active
date: 2026-03-09
screen_id: SCR-SENTRY-EXAMPLE
route: /sentry-example-page
actors:
  - developer
test_id_scope: scr-sentry-example
implementation_files:
  - apps/web/src/app/sentry-example-page/page.tsx
test_files: []
---

# Screen spec — Sentry example
Status: Active (2026-03-09)

## Purpose
Developer-facing example surface for Sentry integration checks.

## Information blocks
- simple integration example content;
- debug/demo actions for Sentry verification.

## Primary actions
- trigger or inspect Sentry example flow.

## Secondary actions
- none beyond developer diagnostics.

## States
- simple ready state;
- example failure/debug state if intentionally triggered.

## Domain-specific behavior
- this is not a business-user surface;
- it exists to verify observability/integration behavior during development and staging.

## Implementation entrypoints
- `apps/web/src/app/sentry-example-page/page.tsx`
