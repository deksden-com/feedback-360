# Seed S1_multi_tenant_min
Status: Draft (2026-03-04)

## Purpose
Минимальный multi-tenant: 2 компании, shared user в обеих компаниях + user только в company A для RLS smoke.

## Creates
- company A, company B
- user shared (same email)
- user company_a_only
- employee A, employee B и employee company_a_only (в каждой company своя запись Employee)
- memberships: shared user→A/B, company_a_only→A
- campaign A, campaign B (оба `started`)
- questionnaire A, questionnaire B (company-scoped)

## Handles
- `company.a`, `company.b`
- `user.shared`
- `user.company_a_only`
- `employee.shared@company.a`, `employee.shared@company.b`, `employee.company_a_only@company.a`
- `membership.shared@company.a`, `membership.shared@company.b`, `membership.company_a_only@company.a`
- `campaign.a`, `campaign.b`
- `questionnaire.a`, `questionnaire.b`

## Usage
- FT-0021 acceptance: переключение `client.setActiveCompany` между A/B + чтение `questionnaire.listAssigned`.
- GS4 (tenant-isolation subset): попытка читать campaign A при active company B должна возвращать `not_found`/`forbidden`.
- GS10/FT-0023: user `company_a_only` видит только строки company A, service role видит обе компании.
