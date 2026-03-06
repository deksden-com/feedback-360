# FT-0153 — Department tree and org editor
Status: Planned (2026-03-06)

## User value
HR поддерживает оргструктуру компании через GUI, а не вручную через данные/CLI.

## Deliverables
- Departments tree.
- Department create/edit and manager assignment.
- Employee move UI with history preview.

## Context (SSoT links)
- [Org structure](../../../../../spec/domain/org-structure.md): departments, manager relations and current-state semantics. Читать, чтобы editor строился на правильной модели.
- [Soft delete and history](../../../../../spec/domain/soft-delete-and-history.md): историчность перемещений и смены руководителя. Читать, чтобы UI не терял timeline.
- [Stitch mapping — EP-015](../../../../../spec/ui/design-references-stitch.md#ep-015--people-and-org-admin): `_2` org management reference.

## Project grounding
- Прочитать EP-003 and existing history rules.
- Проверить seeds with org data and manager relations.

## Implementation plan
- Построить org tree + edit drawers/forms.
- Добавить guided employee move flow.
- Показывать current state and history preview together.

## Scenarios (auto acceptance)
### Setup
- Seed: `S2_org_basic`.

### Action
1. Create/rename department.
2. Assign manager.
3. Move employee to another department.

### Assert
- Current state updates.
- History closes previous record and opens new one.
- Employee profile reflects latest state.

### Client API ops (v1)
- Department and org history ops.

## Manual verification (deployed environment)
- `beta`: edit department tree and move one employee; verify updated employee profile and history hint.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
