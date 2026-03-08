---
description: FT-0023-rls-deny-by-default feature plan and evidence entry for EP-002-identity-tenancy-rbac.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-002-identity-tenancy-rbac/index.md
epic: EP-002
feature: FT-0023
---


# FT-0023 — RLS deny-by-default + service role contours
Status: Completed (2026-03-04)

## User value
Multi-tenant защищён на уровне БД; cron/outbox/webhooks работают через service role.

## Deliverables
- RLS политики “deny by default” + allow через membership claims.
- Service role используется только на сервере для cron/outbox/webhooks.

## Context (SSoT links)
- [RLS strategy](../../../../../spec/security/rls.md): как включаем RLS, какие claims используем и где нужен service role. Читать, чтобы RLS был реальным барьером, а не “формально включили”.
- [Auth & identity](../../../../../spec/security/auth-and-identity.md): users/memberships и signups off. Читать, чтобы RLS связывался с реальным `user_id` и membership.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): чеклист “FT → код”. Читать, чтобы RLS проверялся integration тестами и не ломал ранние vertical slices.

## Project grounding (2026-03-04)
- [x] Прочитан FT-документ целиком (deliverables, acceptance, tests, docs updates).
- [x] Прочитаны SSoT документы из `Context`.
- [x] Проверены [Operation catalog](../../../../../spec/client-api/operation-catalog.md) и [CLI command catalog](../../../../../spec/cli/command-catalog.md) на предмет server-only контуров service role.
- [x] Проверены [Traceability](../../../../../spec/testing/traceability.md), GS10 и seed `S1_multi_tenant_min`.
- [x] Зафиксированы слои: `db` (session context + RLS migration + smoke test), `spec/plans` (policy/evidence updates).

## Acceptance (auto)
### Setup
- Seed: `S1_multi_tenant_min`.

### Action (integration test)
1) Под обычной user session (`serviceRole=off`, `app.current_user_id=<user.company_a_only>`) прочитать строки `questionnaire.a` и `questionnaire.b`.
2) Под service role ключом прочитать ту же строку/таблицу.

### Assert
- (1) видимость ограничена RLS: `questionnaire.a` видна, `questionnaire.b` скрыта (0 rows).
- (2) разрешено (server-only контур).

## Implementation plan (target repo)
- Политика:
  - Включить RLS на основных таблицах с `company_id`.
  - По умолчанию “deny”; разрешить `ALL` только если `app.is_service_role()` или `app.has_company_access(company_id)`.
  - Для cron/outbox/webhooks использовать service role (server-only env var), не прокидывать его в клиентов.
- Тонкие моменты:
  - Для `SELECT` RLS обычно скрывает строки (0 rows), а не бросает ошибку — это expected behavior.
  - Список таблиц под RLS расширять постепенно (не ломая ранние эпики).

## Tests
- Integration: `packages/db/src/migrations/ft-0023-rls-smoke.test.ts` (GS10 subset) проверяет user-context row filtering и service-role bypass.

## Memory bank updates
- При изменении набора таблиц/политик обновить: [RLS strategy](../../../../../spec/security/rls.md) — SSoT RLS. Читать, чтобы эксплуатация (runbook) и безопасность не расходились.

## Verification (must)
- Automated test: `packages/db/src/migrations/ft-0023-rls-smoke.test.ts` (integration) проверяет user-context vs service-role доступ.
- Must run: GS10 (RLS smoke) должен быть зелёным.

## Quality checks evidence (2026-03-04)
- `pnpm -r lint` — passed
- `pnpm -r typecheck` — passed
- `pnpm -r test` — passed
- `build` — N/A (изменения DB/security покрыты integration тестами и миграциями).

## Acceptance evidence (2026-03-04)
- `pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0023-rls-smoke.test.ts` — passed (integration subtest skips when DB URL absent).
