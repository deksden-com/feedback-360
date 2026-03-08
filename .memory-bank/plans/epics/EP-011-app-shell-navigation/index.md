---
description: EP-011-app-shell-navigation epic plan, scope, progress, and evidence entrypoint.
purpose: Read to understand the user value, feature map, and completion state of this epic.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/index.md
epic: EP-011
---


# EP-011 — App shell and navigation
Status: Completed (2026-03-06)

## Goal
Собрать текущий thin UI в цельное приложение: единый shell, role-aware navigation, домашние экраны и устойчивые shared states.

## Scope
- In scope: внутренний layout приложения, навигация, landing pages по ролям, shared empty/loading/error states.
- Out of scope: новые доменные операции и глубокие HR-админские формы; они идут в последующих GUI-эпиках.

## Features (vertical slices)
- [Feature catalog](features/index.md): FT-0111..FT-0113 с пользовательскими сценариями, локальными acceptance checks и beta verification. Читать, чтобы делать shell не “для красоты”, а как основу следующих экранов.

## Dependencies
- Internal:
  - [EP-008 Minimal UI](../EP-008-ui-minimal/index.md): уже работающие экраны, поверх которых строим shell. Читать, чтобы не переписывать рабочий MVP поток.
  - [EP-009 Test & release hardening](../EP-009-test-release-hardening/index.md): release gates и beta smoke, которыми будем подтверждать GUI-фичи. Читать, чтобы новые UI slices сразу закрывались проверками.
- External:
  - `stitch_go360go` visual references.

## Risks & mitigations
- Risk: shell утащит в себя бизнес-логику доступа. → Mitigation: меню и guard-страницы только отражают typed responses/RBAC, но не подменяют server-side checks.
- Risk: redesign сломает существующие beta flows. → Mitigation: сохраняем route compatibility и закрываем каждый slice Playwright + beta smoke.

## Progress report (evidence-based)
- `as_of`: 2026-03-06
- `total_features`: 3
- `completed_features`: 3
- `evidence_confirmed_features`: 3
- verification link:
  - [Verification matrix](../../verification-matrix.md): execution evidence для GUI-эпиков будет вестись здесь. Читать, чтобы сразу планировать проверяемое закрытие каждой фичи.

## Current status
- Closed:
  - [FT-0111 Internal app shell](features/FT-0111-internal-app-shell/index.md): общий shell, role-aware navigation и company context уже реализованы и подтверждены Playwright evidence. Читать, чтобы опираться на готовый app frame для FT-0112 и FT-0113.
  - [FT-0112 Role-aware home dashboards](features/FT-0112-role-home-dashboards/index.md): стартовые экраны по ролям уже реализованы и подтверждены local acceptance. Читать, чтобы FT-0113 добавлял только shared states, а не заново решал information architecture home.
  - [FT-0113 Shared loading, empty and error states](features/FT-0113-shared-states/index.md): shared empty/error/loading states уже реализованы, дружелюбные сообщения подтверждены local Playwright acceptance и evidence. Читать, чтобы следующие GUI-эпики наследовали единый UX language.

## Definition of done
- Все shared layouts и home screens работают через typed client/server adapters без бизнес-логики в компонентах.
- Для каждой FT есть local automated acceptance и пошаговая beta verification инструкция.
- После закрытия эпика обновлены [UI sitemap & flows](../../../spec/ui/sitemap-and-flows.md) и [Stitch design mapping](../../../spec/ui/design-references-stitch.md), чтобы shell и визуальные паттерны были зафиксированы как SSoT.

## Completion note (2026-03-06)
- EP-011 закрыт полностью:
  - shell/navigation, role-aware home dashboards и shared states доведены до evidence-based completion;
  - Playwright acceptance покрывает navigation shell, role-aware home и shared states;
  - следующий GUI слой может безопасно опираться на готовые page-state patterns и единый app shell.
