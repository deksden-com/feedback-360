# EP-002 — Identity, tenancy, RBAC
Status: Completed (2026-03-04)

## Goal
Безопасный multi-tenant доступ: users vs employees, memberships, роли, signups off.

## Features (vertical slices)
- [Feature catalog](features/index.md): список фич EP-002 с acceptance сценариями. Читать, чтобы безопасно реализовать multi-tenant access.

## Scenarios / tests
- GS4 (multi-tenant & RBAC)
- GS10 (RLS smoke)

## Progress report (evidence-based)
- `as_of`: 2026-03-04
- `total_features`: 3
- `completed_features`: 3
- `evidence_confirmed_features`: 3
- verification link:
  - [Verification matrix](../../verification-matrix.md) — execution evidence по EP-002. Читать, чтобы отслеживать подтверждённый прогресс по одному SSoT-источнику.

## Memory bank updates (after EP completion)
- Зафиксировать фактическую модель identity (User vs Employee) и ограничения MVP: [Auth & identity](../../../spec/security/auth-and-identity.md) — определения и правила “users pre-created, signups off”. Читать, чтобы не случился “скрытый signup”.
- Доработать RBAC матрицу до уровня операций: [RBAC spec](../../../spec/security/rbac.md) — роли × действия/ops. Читать, чтобы тесты могли проверять `forbidden` точечно.
- Подтвердить стратегию RLS и service role контуры: [RLS strategy](../../../spec/security/rls.md) — deny-by-default и где используем service role. Читать, чтобы multi-tenant был защищён на уровне БД.
