# EP-016 — People and org admin
Status: Completed (2026-03-06)

## Goal
Дать HR полноценный GUI для справочника сотрудников и оргструктуры: список сотрудников, профиль, подразделения, руководители и история изменений.

## Scope
- In scope: employee directory, employee profile/admin actions, departments tree and org editing.
- Out of scope: matrix builder и model editor; они идут в EP-017.

## Features (vertical slices)
- [Feature catalog](features/index.md): FT-0161..FT-0163. Читать, чтобы закрыть базовый HR-admin контур данных без CLI-зависимости.

## Dependencies
- [EP-002 Identity, tenancy, RBAC](../EP-002-identity-tenancy-rbac/index.md): employee/user/membership model. Читать, чтобы UI отражал реальные сущности и связи.
- [EP-003 Org structure + snapshots](../EP-003-org-snapshots/index.md): department/manager history и snapshot behavior. Читать, чтобы org UI не ломал историю.
- [EP-014 Feature-area slice refactor](../EP-014-feature-area-slices-refactor/index.md): target structure для people/org code paths и docs. Читать, чтобы GUI layer сразу ложился в новую ownership model.

## Progress report (evidence-based)
- `as_of`: 2026-03-06
- `total_features`: 3
- `completed_features`: 3
- `evidence_confirmed_features`: 3
- verification link:
  - [Verification matrix](../../verification-matrix.md): execution evidence для people/org GUI и beta verification. Читать, чтобы проверить local и deployed acceptance по каждому HR flow.

## Definition of done
- HR может завести и поддерживать employees/departments без CLI.
- Историчность и soft-delete markers видны в UI и не теряются.
- Все create/update flows покрыты local acceptance и manual beta checks.

## Current status
- Closed:
  - [FT-0161 Employee directory](features/FT-0161-employee-directory/index.md): HR получил список сотрудников с поиском, фильтрами по статусу/отделу и переходом в профиль.
  - [FT-0162 Employee profile and account provisioning](features/FT-0162-employee-profile-provisioning/index.md): HR может завести сотрудника, обновлять контакты и provisioning user access в рамках компании.
  - [FT-0163 Department tree and org editor](features/FT-0163-org-editor/index.md): departments tree, manager assignment и employee move доступны из GUI с историей изменений.

## Completion note (2026-03-06)
- EP-016 закрыт полностью:
  - в `apps/web` появился полноценный `people-org` feature area с directory, profile и org editor surfaces;
  - typed client API расширен операциями `employee.directoryList`, `employee.profileGet`, `identity.provisionAccess`, `department.list`, `department.upsert`;
  - regression acceptance зелёный локально и на `https://beta.go360go.ru` для FT-0161..FT-0163;
  - PR [#42](https://github.com/deksden-com/feedback-360/pull/42) смержен в `develop`, beta deployment подтверждён после merge commit `4abc86937064cf3086fab1c6ecfc2f8c7b390263`.
