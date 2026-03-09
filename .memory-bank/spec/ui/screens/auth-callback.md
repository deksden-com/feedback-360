---
description: Auth callback screen contract for finishing session bootstrap and redirects.
purpose: Read before changing callback behavior, session bridging, or callback troubleshooting docs.
status: Active
date: 2026-03-09
screen_id: SCR-AUTH-CALLBACK
route: /auth/callback
actors:
  - guest
test_id_scope: scr-auth-callback
implementation_files:
  - apps/web/src/app/auth/callback/page.tsx
test_files:
  - apps/web/playwright/tests/ft-0081-auth-company-switcher.spec.ts
---

# Screen spec — Auth callback
Status: Active (2026-03-09)

## Purpose
Технический экран завершения auth callback и выбора следующего перехода.

## Information blocks
- loading/progress state;
- success redirect behavior;
- fallback error surface when callback cannot complete.

## Primary actions
- none; screen is mostly system-driven.

## Secondary actions
- retry or navigate back to login when callback fails.

## States
- processing callback;
- success redirect to company selection or home;
- error state.

## Domain-specific behavior
- callback must finish обычную app session bootstrap;
- logout and subsequent navigation use normal session rules after callback;
- no business actions live here.

## Implementation entrypoints
- `apps/web/src/app/auth/callback/page.tsx`

## Primary tests
- `apps/web/playwright/tests/ft-0081-auth-company-switcher.spec.ts`
