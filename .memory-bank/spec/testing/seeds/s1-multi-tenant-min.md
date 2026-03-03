# Seed S1_multi_tenant_min (planned)
Status: Draft (2026-03-03)

## Purpose
Минимальный multi-tenant: 2 компании и 1 user в обоих memberships.

## Creates
- company A, company B
- user shared (same email)
- employee A, employee B (в каждой company своя запись Employee)
- memberships: user→A, user→B (roles configurable)

## Handles (examples)
- `company.a`, `company.b`
- `user.shared`
- `employee.shared@company.a`, `employee.shared@company.b`

