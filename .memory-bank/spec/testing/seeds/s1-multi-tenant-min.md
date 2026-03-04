# Seed S1_multi_tenant_min
Status: Draft (2026-03-04)

## Purpose
Минимальный multi-tenant: 2 компании и 1 user в обоих memberships.

## Creates
- company A, company B
- user shared (same email)
- employee A, employee B (в каждой company своя запись Employee)
- memberships: user→A, user→B (roles configurable)
- campaign A, campaign B (оба `started`)
- questionnaire A, questionnaire B (company-scoped)

## Handles
- `company.a`, `company.b`
- `user.shared`
- `employee.shared@company.a`, `employee.shared@company.b`
- `membership.shared@company.a`, `membership.shared@company.b`
- `campaign.a`, `campaign.b`
- `questionnaire.a`, `questionnaire.b`

## Usage
- FT-0021 acceptance: переключение `client.setActiveCompany` между A/B + чтение `questionnaire.listAssigned`.
- GS4 (tenant-isolation subset): попытка читать campaign A при active company B должна возвращать `not_found`/`forbidden`.
