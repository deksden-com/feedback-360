# EP-016 — Competency models and matrix UI
Status: Planned (2026-03-06)

## Goal
Дать HR GUI для моделей компетенций и матрицы оценивания: список версий, редактор моделей и matrix builder с preview freeze behavior.

## Scope
- In scope: model catalog/version hub, model editor, matrix builder.
- Out of scope: campaign list/dashboard и org editor; они покрываются EP-012 и EP-015.

## Features (vertical slices)
- [Feature catalog](features/index.md): FT-0161..FT-0163. Читать, чтобы закрыть “настройку содержания оценки” и “кто кого оценивает” в GUI.

## Dependencies
- [EP-003 Org structure + snapshots](../EP-003-org-snapshots/index.md): матрица зависит от орг-данных и snapshot semantics. Читать, чтобы builder не нарушал snapshot boundary.
- [EP-004 Models + campaigns + questionnaires](../EP-004-campaigns-questionnaires/index.md): models, campaign start и lock rules. Читать, чтобы editor/builder не позволяли недопустимых изменений.

## Progress report (evidence-based)
- `as_of`: 2026-03-06
- `total_features`: 3
- `completed_features`: 0
- `evidence_confirmed_features`: 0
- verification link:
  - [Verification matrix](../../verification-matrix.md): сюда добавим matrix/model acceptance как только пойдём в реализацию. Читать, чтобы сценарии были привязаны к seed и GS.

## Definition of done
- HR может создать/редактировать model draft versions и настраивать matrix assignment без CLI.
- Lock rules и started immutability отражаются в UI корректно.
- Все editor flows проверяемы локально и на `beta`.
