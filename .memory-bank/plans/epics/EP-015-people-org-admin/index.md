# EP-015 — People and org admin
Status: Planned (2026-03-06)

## Goal
Дать HR полноценный GUI для справочника сотрудников и оргструктуры: список сотрудников, профиль, подразделения, руководители и история изменений.

## Scope
- In scope: employee directory, employee profile/admin actions, departments tree and org editing.
- Out of scope: matrix builder и model editor; они идут в EP-016.

## Features (vertical slices)
- [Feature catalog](features/index.md): FT-0151..FT-0153. Читать, чтобы закрыть базовый HR-admin контур данных без CLI-зависимости.

## Dependencies
- [EP-002 Identity, tenancy, RBAC](../EP-002-identity-tenancy-rbac/index.md): employee/user/membership model. Читать, чтобы UI отражал реальные сущности и связи.
- [EP-003 Org structure + snapshots](../EP-003-org-snapshots/index.md): department/manager history и snapshot behavior. Читать, чтобы org UI не ломал историю.

## Progress report (evidence-based)
- `as_of`: 2026-03-06
- `total_features`: 3
- `completed_features`: 0
- `evidence_confirmed_features`: 0
- verification link:
  - [Verification matrix](../../verification-matrix.md): будущие проверки people/org GUI будут добавлены сюда. Читать, чтобы не забыть о beta validation орг-потока.

## Definition of done
- HR может завести и поддерживать employees/departments без CLI.
- Историчность и soft-delete markers видны в UI и не теряются.
- Все create/update flows покрыты local acceptance и manual beta checks.
