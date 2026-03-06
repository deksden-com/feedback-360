# EP-012 — HR campaigns UX
Status: Planned (2026-03-06)

## Goal
Превратить текущий operational workbench в полноценный HR интерфейс управления кампаниями: список, создание, detail dashboard и daily operations.

## Scope
- In scope: campaigns list, create/edit draft flow, campaign detail/dashboard, progress and lifecycle controls.
- Out of scope: отдельный matrix builder editor и competency model editor — они идут в EP-016.

## Features (vertical slices)
- [Feature catalog](features/index.md): FT-0121..FT-0123 с end-to-end сценариями HR Admin. Читать, чтобы построить один из главных business surfaces системы.

## Dependencies
- [EP-004 Models + campaigns + questionnaires](../EP-004-campaigns-questionnaires/index.md): доменные правила lifecycle и freeze. Читать, чтобы UI не нарушал state machine.
- [EP-008 Minimal UI](../EP-008-ui-minimal/index.md): текущий workbench и route handlers. Читать, чтобы эволюционировать существующие экраны, а не строить параллельный UI.

## Progress report (evidence-based)
- `as_of`: 2026-03-06
- `total_features`: 3
- `completed_features`: 0
- `evidence_confirmed_features`: 0
- verification link:
  - [Verification matrix](../../verification-matrix.md): будущие acceptance/evidence по EP-012 пойдут сюда. Читать, чтобы заранее знать обязательные beta и local checks.

## Definition of done
- HR может пройти полный путь “создать → настроить → запустить → наблюдать → завершить/перезапустить AI” через GUI.
- Каждая FT подтверждается Playwright сценариями и beta manual runbook.
- После эпика обновлены [UI sitemap & flows](../../../spec/ui/sitemap-and-flows.md) и [design references](../../../spec/ui/design-references-stitch.md), чтобы HR zone была описана как SSoT.
