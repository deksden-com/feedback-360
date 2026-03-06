# FT-0163 — Department tree and org editor
Status: Completed (2026-03-06)

## User value
HR поддерживает оргструктуру компании через GUI, а не вручную через данные/CLI.

## Deliverables
- Departments tree.
- Department create/edit and manager assignment.
- Employee move UI with history preview.

## Context (SSoT links)
- [Org structure](../../../../../spec/domain/org-structure.md): departments, manager relations and current-state semantics. Читать, чтобы editor строился на правильной модели.
- [Soft delete and history](../../../../../spec/domain/soft-delete-and-history.md): историчность перемещений и смены руководителя. Читать, чтобы UI не терял timeline.
- [Stitch mapping — EP-016](../../../../../spec/ui/design-references-stitch.md#ep-016--people-and-org-admin): `_2` org management reference.

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
- `department.list`
- `department.upsert`
- `org.department.move`
- `org.manager.set`

## Manual verification (deployed environment)
- `beta`: edit department tree and move one employee; verify updated employee profile and history hint.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
- [Client API operation catalog](../../../../../spec/client-api/operation-catalog.md)

## Progress note (2026-03-06)
- Выполнен вертикальный слайс FT-0163:
  - `/hr/org` даёт department tree, department editor и selected employee controls в одном surface;
  - employee moves и manager assignment используют существующие history-aware operations, а UI показывает current state рядом с history blocks;
  - org screen связан с employee profile, поэтому HR может быстро проверять эффект изменений.

## Quality checks evidence (2026-03-06)
- `pnpm lint` → passed.
- `pnpm typecheck` → passed.
- `pnpm --filter @feedback-360/web test` → passed.
- `pnpm --filter @feedback-360/web build` → passed.

## Acceptance evidence (2026-03-06)
- Local acceptance:
  - `cd apps/web && PLAYWRIGHT_BASE_URL=http://localhost:3105 node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0163-org-editor.spec.ts --workers=1 --reporter=line` → passed.
- Covered acceptance:
  - HR создаёт/переименовывает department и видит обновлённое дерево;
  - manager assignment и employee move обновляют current state;
  - employee profile/history отражает последнюю оргструктуру без потери прошлых записей.
- Artifacts:
  - org editor.
    ![ft-0163-org-editor](../../../../../evidence/EP-016/FT-0163/2026-03-06/step-01-org-editor.png)

## Manual verification (deployed environment)
### Beta scenario — org editor
- Environment:
  - URL: `https://beta.go360go.ru`
  - account: `hr_admin` with seeded company access
- Steps:
  1. Войти и открыть `/hr/org`.
  2. Создать новый department или переименовать существующий.
  3. Назначить manager и переместить одного сотрудника.
  4. Открыть профиль этого сотрудника и проверить latest department/manager/history.
- Expected:
  - department tree обновляется после save;
  - selected employee card показывает новую структуру;
  - profile/history синхронно отражает move и manager change.
- Result:
  - pending until merge to `develop` and beta deployment.
