# Seed S1_company_roles_min (planned)
Status: Draft (2026-03-03)

## Purpose
Минимальный набор пользователей/сотрудников для RBAC тестов: hr_admin, hr_reader, manager, employee в одной компании.

## Creates
- company (with timezone)
- 4 users (Supabase Auth) с разными emails
- 4 employees (HR directory)
- 4 memberships в company:
  - `hr_admin`
  - `hr_reader`
  - `manager`
  - `employee`

## Handles (examples)
- `company.main`
- `user.hr_admin`, `user.hr_reader`, `user.manager`, `user.employee`
- `employee.hr_admin`, `employee.hr_reader`, `employee.manager`, `employee.employee`
- `membership.hr_reader@company.main` (и т.п.)

