# FT-0161 — Employee directory
Status: Planned (2026-03-06)

## User value
HR быстро находит сотрудника по имени, email, отделу и статусу.

## Deliverables
- Employee directory table.
- Search and filters.
- Status markers for active/inactive/soft-deleted records.

## Context (SSoT links)
- [Auth and identity](../../../../../spec/security/auth-and-identity.md): user vs employee model. Читать, чтобы directory не смешивал сущности.
- [Soft delete and history](../../../../../spec/domain/soft-delete-and-history.md): как отображать inactive/deleted data. Читать, чтобы records не “исчезали”.
- [Stitch mapping — EP-016](../../../../../spec/ui/design-references-stitch.md#ep-016--people-and-org-admin): employee directory reference.

## Project grounding
- Проверить current employee data model and seeds.
- Свериться with HR role permissions and planned routes.

## Implementation plan
- Собрать list page with search/filter.
- Добавить status chips and deep link to profile.
- Preserve company scoping and pagination strategy.

## Scenarios (auto acceptance)
### Setup
- Seed: `S2_org_basic` plus inactive/deleted variants.

### Action
1. Open employee directory.
2. Search by email/name.
3. Filter by department/status.

### Assert
- Correct list subset returned.
- Status markers visible.
- Profile link opens targeted employee.

### Client API ops (v1)
- Employee directory/profile read ops.

## Manual verification (deployed environment)
- `beta`: search/filter employee records and open profile from list.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
