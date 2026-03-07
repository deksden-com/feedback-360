# Component usage rules
Status: Draft (2026-03-07)

Цель: зафиксировать повторяемые UI patterns для экранов, чтобы pages выглядели как один продукт, а не как набор разных стилей.

## Page header
Use for:
- page title,
- subtitle,
- status/context metadata,
- single primary action.

Do not overload header with diagnostics that matter only occasionally.

## Summary strip
Use for:
- KPI cards,
- progress,
- response rate,
- deadlines,
- top-level state.

Summary strip sits above primary content on dashboards and operational detail pages.

## Toolbar
Use on CRUD/list pages:
- search,
- filters,
- create button,
- secondary bulk/sort actions.

Toolbar belongs above list content, not inside individual cards.

## List row / card
Use for:
- employees,
- campaigns,
- models,
- questionnaires.

Each row/card should answer:
1. what is this object,
2. what state is it in,
3. what can I do next.

## Detail screen
Use:
- summary at top,
- main content center,
- secondary metadata/diagnostics in a lower section or side rail.

## Results/report block
Use:
- summary hero,
- group sections,
- competency sections,
- processed/raw text sections with clear visual separation.

## Questionnaire section
Use:
- one competency per stable content block,
- score + comment grouped visually,
- progress and save state always visible.
