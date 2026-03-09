---
description: EP-012-hr-campaigns-ux epic plan, scope, progress, and evidence entrypoint.
purpose: Read to understand the user value, feature map, and completion state of this epic.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/epics/index.md
epic: EP-012
---


# EP-012 — HR campaigns UX
Status: Completed (2026-03-06)

## Goal
Превратить текущий operational workbench в полноценный HR интерфейс управления кампаниями: список, создание, detail dashboard и daily operations.

## Scope
- In scope: campaigns list, create/edit draft flow, campaign detail/dashboard, progress and lifecycle controls.
- Out of scope: отдельный matrix builder editor и competency model editor — они идут в EP-017.

## Features (vertical slices)
- [Feature catalog](features/index.md): FT-0121..FT-0123 с end-to-end сценариями HR Admin. Читать, чтобы построить один из главных business surfaces системы.

## Dependencies
- [EP-004 Models + campaigns + questionnaires](../EP-004-campaigns-questionnaires/index.md): доменные правила lifecycle и freeze. Читать, чтобы UI не нарушал state machine.
- [EP-008 Minimal UI](../EP-008-ui-minimal/index.md): текущий workbench и route handlers. Читать, чтобы эволюционировать существующие экраны, а не строить параллельный UI.

## Progress report (evidence-based)
- `as_of`: 2026-03-06
- `total_features`: 3
- `completed_features`: 3
- `evidence_confirmed_features`: 3
- verification link:
  - [Verification matrix](../../verification-matrix.md): execution evidence по FT-0121..FT-0123 зафиксировано здесь. Читать, чтобы быстро увидеть proof и команды проверок.

## Definition of done
- HR может пройти полный путь “создать → настроить → запустить → наблюдать → завершить/перезапустить AI” через GUI.
- Каждая FT подтверждается Playwright сценариями и beta manual runbook.
- После эпика обновлены [UI sitemap & flows](../../../spec/ui/sitemap-and-flows.md) и [design references](../../../spec/ui/design-references-stitch.md), чтобы HR zone была описана как SSoT.

## Current status
- Closed:
  - [FT-0121 Campaign list and filters](features/FT-0121-campaign-list/index.md): список кампаний, status counters и переход в detail page реализованы и подтверждены Playwright evidence.
  - [FT-0122 Campaign create and draft configuration](features/FT-0122-campaign-draft-config/index.md): create/edit draft flow реализован через user-facing form и подтверждён re-open acceptance.
  - [FT-0123 Campaign detail dashboard and daily operations](features/FT-0123-campaign-detail-dashboard/index.md): detail dashboard, lock state и AI retry surface реализованы и подтверждены локальным acceptance.

## Completion note (2026-03-06)
- EP-012 закрыт полностью:
  - HR campaign zone теперь состоит из списка, create/edit draft flow и detail dashboard поверх существующего workbench;
  - добавлены typed operations и CLI helpers для campaign list/detail/draft, чтобы GUI и automation использовали один контракт;
  - canonical seed `S4_campaign_draft` теперь включает published model version, чтобы draft-first GUI и acceptance tests были воспроизводимыми.
