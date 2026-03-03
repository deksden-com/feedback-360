# EP-000 — Foundation
Status: Draft (2026-03-03)

## Goal
Сделать проект воспроизводимым: монорепо, линт/тесты, БД/миграции, seed scenarios как контракт для тестов.

## Features (vertical slices)
- [Feature catalog](features/index.md): список фич EP-000 с acceptance сценариями. Читать, чтобы реализовать фундамент пошагово и проверяемо.

## Deliverables
- Репо-структура по `.memory-bank/spec/project/repo-structure.md`
- Минимальные команды CLI: `seed --scenario ... --json`
- Набор seeds S0..S5 (минимум) + handles.

## Scenarios / tests
- Smoke: применить миграции + `seed S1_company_min`.
- Golden: GS1 использует seeds из этого эпика.

## Memory bank updates (after EP completion)
- Обновить/подтвердить `spec/project/*` (SSoT по структуре и стеку): [Project specs index](../../../spec/project/index.md) — что внутри и где искать решения. Читать, чтобы “скелет” проекта и реальный scaffold не разошлись.
- Зафиксировать реальные команды и ограничения seed runner в `spec/testing/*`: [Seed scenarios principles](../../../spec/testing/seed-scenarios.md) — контракт handles/variants. Читать, чтобы тесты не хардкодили id.
- Синхронизировать “как запускаем” с `spec/engineering/*`: [Engineering index](../../../spec/engineering/index.md) — стандарты форматирования/тестов/доков. Читать, чтобы CI и локальные команды совпадали.
