# FT-0214 — HR CRUD and hierarchy polish
Status: Draft (2026-03-07)

## User value
HR работает со справочником сотрудников и оргструктурой через привычные CRUD/hierarchy patterns: искать, открывать, редактировать и понимать структуру компании становится проще и быстрее.

## Deliverables
- Employee directory toolbar and row/card hierarchy closer to common SaaS CRUD.
- Employee detail screen with clearer summary/history layout.
- Org editor with stronger visible hierarchy and selected-node detail pane.

## Context (SSoT links)
- [Screen-by-screen redesign](../../../../../spec/ui/screen-by-screen-redesign.md): recommendations for employees and org screens. Читать, чтобы FT закрывал именно agreed UI debt.
- [UI design principles](../../../../../spec/ui/design-principles.md): CRUD and hierarchy patterns. Читать, чтобы polish был product-consistent.
- [Design system](../../../../../spec/ui/design-system/index.md): component rules, toolbar/list/detail patterns and sync policy. Читать, чтобы employees/org polish использовал единый visual language.
- [EP-016 People and org admin](../../../EP-016-people-org-admin/index.md): baseline delivered functionality. Читать, чтобы не потерять уже работающие admin flows.
- [Org snapshots and history](../../../../../spec/domain/soft-delete-and-history.md): history is important and must stay visible. Читать, чтобы visual changes не скрыли важную историчность.

## Project grounding
- Пройти manual tutorial steps for employees/org.
- Проверить current beta screens and current routes.
- Свериться with existing acceptance tests for FT-0161..FT-0163.

## Implementation plan
- `Employees`:
  - improve toolbar hierarchy;
  - emphasize person identity, position, department, status;
  - make list rows/cards easier to scan.
- `Employee detail`:
  - promote summary block;
  - separate history/provisioning as secondary sections.
- `Org`:
  - strengthen tree indentation and selected department context;
  - use a two-panel layout where left is tree, right is current node detail.

## Scenarios (auto acceptance)
### Setup
- Existing people/org seeds and beta demo workspace.

### Action
1. Open employee directory and filter/search.
2. Open employee profile.
3. Open org editor and switch between departments.

### Assert
- Primary HR tasks remain unchanged.
- List and hierarchy are easier to parse but functionality is preserved.
- Manager/department relationships remain visible.

### Client API ops (v1)
- existing people/org operations only.

## Manual verification (deployed environment)
- Beta walkthrough:
  - employees list
  - employee profile
  - org tree
  - selected department details

## Tests
- Existing FT-0161..FT-0163 Playwright suites.
- Screenshot-based evidence update in tutorial and/or feature evidence.

## Docs updates (SSoT)
- `spec/ui/screen-by-screen-redesign.md`
- guides/tutorial screenshots for employees/org
- relevant future screen specs when added
