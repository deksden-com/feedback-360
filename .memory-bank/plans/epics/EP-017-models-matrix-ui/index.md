---
description: EP-017-models-matrix-ui epic plan, scope, progress, and evidence entrypoint.
purpose: Read to understand the user value, feature map, and completion state of this epic.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/index.md
epic: EP-017
---


# EP-017 — Competency models and matrix UI
Status: Completed (2026-03-06)

## Goal
Дать HR GUI для моделей компетенций и матрицы оценивания: список версий, редактор моделей и matrix builder с preview freeze behavior.

## Scope
- In scope: model catalog/version hub, model editor, matrix builder.
- Out of scope: campaign list/dashboard и org editor; они покрываются EP-012 и EP-015.

## Features (vertical slices)
- [Feature catalog](features/index.md): FT-0171..FT-0173. Читать, чтобы закрыть “настройку содержания оценки” и “кто кого оценивает” в GUI.

## Dependencies
- [EP-003 Org structure + snapshots](../EP-003-org-snapshots/index.md): матрица зависит от орг-данных и snapshot semantics. Читать, чтобы builder не нарушал snapshot boundary.
- [EP-004 Models + campaigns + questionnaires](../EP-004-campaigns-questionnaires/index.md): models, campaign start и lock rules. Читать, чтобы editor/builder не позволяли недопустимых изменений.
- [EP-014 Feature-area slice refactor](../EP-014-feature-area-slices-refactor/index.md): target structure для `models` и `matrix` areas. Читать, чтобы editor/builder не наращивали новый UI на legacy layout.

## Progress report (evidence-based)
- `as_of`: 2026-03-06
- `total_features`: 3
- `completed_features`: 3
- `evidence_confirmed_features`: 3
- verification link:
  - [Verification matrix](../../verification-matrix.md): execution evidence для model/matrix GUI, CLI contract coverage и beta acceptance. Читать, чтобы проверить local и deployed acceptance по каждому HR flow.

## Definition of done
- HR может создать/редактировать model draft versions и настраивать matrix assignment без CLI.
- Lock rules и started immutability отражаются в UI корректно.
- Все editor flows проверяемы локально и на `beta`.

## Current status
- Closed:
  - [FT-0171 Model catalog and version hub](features/FT-0171-model-catalog/index.md): HR получил каталог моделей с version statuses, filter flow и clone draft action.
  - [FT-0172 Model editor](features/FT-0172-model-editor/index.md): draft editor для indicators/levels, weight validation и publish flow работает через GUI.
  - [FT-0173 Matrix builder with freeze preview](features/FT-0173-matrix-builder/index.md): department-based autogen, matrix save и lock/read-only states доступны из campaign UI.

## Completion note (2026-03-06)
- EP-017 закрыт полностью:
  - в `apps/web` появился отдельный `models-matrix` feature area с model catalog, draft editor и matrix builder routes;
  - typed client API расширен операциями `model.version.get`, `model.version.cloneDraft`, `model.version.upsertDraft`, `model.version.publish`, `matrix.list`;
  - CLI получил команды `model version get|clone-draft|save-draft|publish` и `matrix list`, чтобы web/cli оставались на одном contract;
  - local quality gate и acceptance зелёные, beta acceptance подтверждён на `https://beta.go360go.ru`;
  - PR [#44](https://github.com/deksden-com/feedback-360/pull/44) смержен в `develop`, beta deployment подтверждён после merge commit `5b7cdc5`.
