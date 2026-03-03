# Seed S2_org_basic
Status: Draft (2026-03-03)

## Purpose
Базовая оргструктура для автогенерации матрицы и проверки иерархий.

## Requires
- `S1_company_min`

## Creates (example topology)
- root department
- два дочерних department’а одного уровня (A и B)
- общий вышестоящий руководитель для A и B (для peers между руководителями)
- сотрудники и руководители подразделений

## Handles (examples)
- `company.main`
- `department.root`, `department.a`, `department.b`
- `employee.ceo`
- `employee.head_a`, `employee.head_b`
- `employee.staff_a1`, `employee.staff_a2`, …
