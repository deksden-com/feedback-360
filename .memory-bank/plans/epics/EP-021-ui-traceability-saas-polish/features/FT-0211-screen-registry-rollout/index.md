---
description: FT-0211-screen-registry-rollout feature plan and evidence entry for EP-021-ui-traceability-saas-polish.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-021-ui-traceability-saas-polish/index.md
epic: EP-021
feature: FT-0211
---


# FT-0211 — Screen registry rollout
Status: Completed (2026-03-07)

## User value
Команда быстрее и безопаснее меняет UI: любой экран, guide, screenshot и evidence можно быстро связать между собой и обновить без ручного расследования.

## Deliverables
- Полный `screen-registry.md` для route-level screens.
- Frontmatter `screen_id` / `screen_ids` в релевантных UI docs.
- Screenshot naming convention `__(SCR-...)` applied to active UI docs/evidence patterns.
- JSDoc convention `@screenId` / `@testIdScope` documented and partially rolled out to key route files.

## Context (SSoT links)
- [Screen registry](../../../../../spec/ui/screen-registry.md): канонический список экранов и `testIdScope`. Читать, чтобы rollout не создавал duplicate ids.
- [Test ID registry](../../../../../spec/ui/test-id-registry.md): naming contract для stable selectors. Читать, чтобы screen rollout сразу совпал с automation naming.
- [Design system sync policy](../../../../../spec/ui/design-system/sync-policy.md): когда visual changes обязаны обновлять registry/screenshots/guides. Читать, чтобы traceability rollout сразу встроился в UI process.
- [Coding style](../../../../../spec/engineering/coding-style.md): правила JSDoc и UI conventions. Читать, чтобы аннотации в коде были единообразными.
- [MBB principles](../../../../../mbb/principles.md): правило обязательных `screen_id` для UI traceability. Читать, чтобы rollout был частью SSoT, а не локальным refactor.

## Project grounding
- Проверить все current route-level screens в `apps/web/src/app`.
- Свериться с текущими guides/tutorials/screens specs и понять, где уже есть UI screenshots.
- Подготовить список active screenshots/docs для переименования/обновления.

## Implementation plan
- Завершить registry покрытием всех текущих маршрутов.
- Добавить frontmatter к существующим UI docs.
- Проставить JSDoc `@screenId` и `@testIdScope` в page-level files и screen containers.
- Нормализовать имена скриншотов в ключевых guides/evidence, не ломая ссылки.

## Scenarios (auto acceptance)
### Setup
- No DB seed required; docs/codebase traceability slice.

### Action
1. Run code/doc search by `screen_id`.
2. Check that each route-level screen has a registry entry.
3. Check that key guides/screens specs reference those ids.

### Assert
- No orphan route-level screen without `screen_id`.
- `rg "SCR-" .memory-bank apps/web/src/app apps/web/src/features` returns consistent traceability graph.
- Tutorials/how-to docs with screenshots declare `screen_ids`.

### Client API ops (v1)
- N/A (documentation and UI structure slice).

## Manual verification (deployed environment)
- N/A; this slice changes traceability system, not user-facing runtime behavior.

## Tests
- Docs audit.
- Repo search-based verification command recorded in acceptance evidence.

## Quality checks evidence (2026-03-07)
- `pnpm docs:audit` → passed
- `node scripts/audit-memory-bank.mjs --ep EP-021` → pending until other FT evidence sections are filled; FT-0211 inputs are in place

## Acceptance evidence (2026-03-07)
- `rg "SCR-" .memory-bank apps/web/src/app apps/web/src/features` confirms shared `screen_id` graph across registry, screen specs, guides and page-level JSDoc
- `find .memory-bank/guides/assets/manual-first-campaign -maxdepth 1 -type f | sort` confirms active tutorial screenshots use `__(SCR-...)` suffix
- Screen registry now links to screen specs for employees, org, campaigns and results manager/HR surfaces

## Docs updates (SSoT)
- `spec/ui/*`
- `spec/engineering/coding-style.md`
- `mbb/principles.md`
- relevant guides/tutorials
