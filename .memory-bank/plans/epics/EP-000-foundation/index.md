# EP-000 — Foundation
Status: Completed (2026-03-04)

## Goal
Сделать проект воспроизводимым: монорепо, линт/тесты, БД/миграции, seed scenarios как контракт для тестов.

## Features (vertical slices)
- [Feature catalog](features/index.md): список фич EP-000 с acceptance сценариями. Читать, чтобы реализовать фундамент пошагово и проверяемо.

## Deliverables
- Репо-структура по `.memory-bank/spec/project/repo-structure.md`
- Минимальные команды CLI: `pnpm seed --scenario ... --json`
- Набор seeds `S0_empty`, `S1_company_min`, `S2_org_basic` + handles.
- Ops baseline для деплоя: git flow + deployment architecture + DNS SSoT.

## Scenarios / tests
- Smoke: применить миграции + `pnpm seed --scenario S1_company_min --json`.
- Golden: GS1 использует seeds из этого эпика.

## Acceptance revalidation (2026-03-04)
- Все completed фичи `FT-0001..FT-0006` перепроверены по их acceptance-сценариям.
- Доказательства запусков вынесены в каждую feature-страницу и сводный реестр:
  - [Verification matrix](../../verification-matrix.md) — секция `EP-000 execution evidence (2026-03-04)`.

## Progress report (evidence-based)
- `as_of`: 2026-03-04
- `total_features`: 6
- `completed_features`: 6
- `evidence_confirmed_features`: 6
- verification link:
  - [Verification matrix](../../verification-matrix.md) — execution evidence по EP-000. Читать, чтобы проверить доказанный прогресс эпика по одному SSoT-источнику.

## Memory bank updates (after EP completion)
- Обновить/подтвердить `spec/project/*` (SSoT по структуре и стеку): [Project specs index](../../../spec/project/index.md) — что внутри и где искать решения. Читать, чтобы “скелет” проекта и реальный scaffold не разошлись.
- Зафиксировать реальные команды и ограничения seed runner в `spec/testing/*`: [Seed scenarios principles](../../../spec/testing/seed-scenarios.md) — контракт handles/variants. Читать, чтобы тесты не хардкодили id.
- Синхронизировать “как запускаем” с `spec/engineering/*`: [Engineering index](../../../spec/engineering/index.md) — стандарты форматирования/тестов/доков. Читать, чтобы CI и локальные команды совпадали.
