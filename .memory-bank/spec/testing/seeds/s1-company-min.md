# Seed S1_company_min
Status: Draft (2026-03-03)

## Purpose
Базовое состояние: одна компания и один HR Admin (как User+Employee+Membership).

## Creates
- company (with timezone)
- user (supabase auth user, pre-created)
- employee (HR directory record)
- membership (role = hr_admin)

## Handles (examples)
- `company.main`
- `user.hr_admin`
- `employee.hr_admin`
- `membership.hr_admin@company.main`

