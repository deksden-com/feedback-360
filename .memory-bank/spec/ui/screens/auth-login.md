---
description: Auth login screen contract with entry actions, states, and traceability links.
purpose: Read before changing login UX, auth entry automation, or related guides.
status: Active
date: 2026-03-09
screen_id: SCR-AUTH-LOGIN
route: /auth/login
actors:
  - guest
test_id_scope: scr-auth-login
implementation_files:
  - apps/web/src/app/auth/login/page.tsx
test_files:
  - apps/web/playwright/tests/ft-0081-auth-company-switcher.spec.ts
---

# Screen spec — Auth login
Status: Active (2026-03-09)

## Purpose
Стартовый экран входа по magic link или test-only XE/dev token login.

## Information blocks
- product identity and trust messaging;
- work email input for magic link;
- XE/dev token helper in non-prod-like environments;
- success and error feedback after submit.

## Primary actions
- request magic link by work email;
- sign in via XE/dev token when allowed.

## Secondary actions
- open support/privacy links if present in current visual system.

## States
- idle;
- submitting magic link;
- success (“check your email”);
- token login expanded/collapsed;
- invalid input / failed request.

## Domain-specific behavior
- public signups stay disabled; email must exist in HR directory;
- XE/dev token login is allowed only in local/beta-like environments;
- successful login continues into the normal authenticated session flow.

## Implementation entrypoints
- `apps/web/src/app/auth/login/page.tsx`: route-level login surface and dev/XE helper.

## Primary tests
- `apps/web/playwright/tests/ft-0081-auth-company-switcher.spec.ts`
