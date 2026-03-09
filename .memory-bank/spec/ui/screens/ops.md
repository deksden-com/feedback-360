---
description: Ops console screen contract for health, release, and diagnostics surfaces.
purpose: Read before changing operational dashboard UX or diagnostics visibility.
status: Active
date: 2026-03-09
screen_id: SCR-OPS
route: /ops
actors:
  - hr_admin
  - hr_reader
test_id_scope: scr-ops
implementation_files:
  - apps/web/src/app/ops/page.tsx
test_files:
  - apps/web/playwright/tests/ft-0191-health-release-dashboard.spec.ts
  - apps/web/playwright/tests/ft-0192-ai-diagnostics.spec.ts
  - apps/web/playwright/tests/ft-0193-audit-console.spec.ts
---

# Screen spec — Ops console
Status: Active (2026-03-09)

## Purpose
Эксплуатационный экран health/release/audit/AI diagnostics.

## Information blocks
- environment health and release summary;
- AI job and webhook diagnostics;
- audit console entries;
- operational notices for beta/prod.

## Primary actions
- inspect environment status;
- inspect AI processing and audit trails.

## Secondary actions
- navigate to related operational sections or release diagnostics.

## States
- healthy environment;
- degraded health / pending diagnostics;
- empty audit window.

## Domain-specific behavior
- operational visibility must not expose privileged secrets;
- destructive operational actions, if any, remain restricted by role and environment.

## Implementation entrypoints
- `apps/web/src/app/ops/page.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0191-health-release-dashboard.spec.ts`
- `apps/web/playwright/tests/ft-0192-ai-diagnostics.spec.ts`
- `apps/web/playwright/tests/ft-0193-audit-console.spec.ts`
