# FT-0152 — Employee profile and account provisioning
Status: Planned (2026-03-06)

## User value
HR может создать сотрудника, связанный user account и обновлять email/роль в рамках компании без обходных операций.

## Deliverables
- Employee profile page.
- Create/edit flow for employee + user linkage.
- Company role editor and contact fields.

## Context (SSoT links)
- [Auth and identity](../../../../../spec/security/auth-and-identity.md): заранее созданные accounts, email as identity, user multi-company membership. Читать, чтобы provisioning flow был верным.
- [RBAC](../../../../../spec/security/rbac.md): кто может редактировать сотрудника и роли. Читать, чтобы UI actions соответствовали permissions.
- [Stitch mapping — EP-015](../../../../../spec/ui/design-references-stitch.md#ep-015--people-and-org-admin): detail/profile visual direction.

## Project grounding
- Проверить account creation/update rules and relevant CLI/client ops.
- Свериться with email update behavior and uniqueness constraints.

## Implementation plan
- Сделать profile editor with create and update modes.
- Показать separation user vs employee, but keep workflow simple for HR.
- Add role and contact sections.

## Scenarios (auto acceptance)
### Setup
- Seed: `S1_company_min`, `S1_company_roles_min`.

### Action
1. Create employee + user.
2. Update email.
3. Change company role.

### Assert
- Pair `user/employee` remains unique within company.
- Updated email persists.
- Forbidden actions blocked for non-admin readers.

### Client API ops (v1)
- Employee create/update, membership update, provisioning ops.

## Manual verification (deployed environment)
- `beta`: создать тестового сотрудника, изменить email и проверить дальнейший login flow.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
