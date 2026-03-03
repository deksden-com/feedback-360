# EP-003 — Org structure + snapshots
Status: Draft (2026-03-03)

## Goal
Ввести оргструктуру и снапшоты на старт кампании, чтобы матрица и история были консистентны.

## Features (vertical slices)
- [Feature catalog](features/index.md): список фич EP-003 с acceptance сценариями. Читать, чтобы оргструктура и снапшоты работали консистентно.

## Scenarios / tests
- GS8 (snapshot immutability)
- GS11 (matrix autogen)

## Memory bank updates (after EP completion)
- Уточнить фактическую структуру оргданных и историю изменений: [Org structure](../../../spec/domain/org-structure.md) — что считаем “историей” и как её читаем. Читать, чтобы имплементация не потеряла временные интервалы.
- Подтвердить snapshot контракт и неизменяемость после start: [Campaign lifecycle](../../../spec/domain/campaign-lifecycle.md) — правила start/lock/end. Читать, чтобы snapshot делался в правильный момент и не обновлялся “по ошибке”.
- Синхронизировать autogen матрицы с правилами домена: [Assignments & matrix](../../../spec/domain/assignments-and-matrix.md) — как вычисляем peers/manager/subordinates. Читать, чтобы автогенерация соответствовала agreed механике.
