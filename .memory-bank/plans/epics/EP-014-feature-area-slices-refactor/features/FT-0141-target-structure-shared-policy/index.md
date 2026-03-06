# FT-0141 — Feature-area target structure and shared-module policy
Status: Completed (2026-03-06)

## Traceability (mandatory)
- Epic: [EP-014 — Feature-area slice refactor](../../index.md)
- PR: должен ссылаться на этот FT-документ и на execution evidence в [Verification matrix](../../../../verification-matrix.md).
- Commits/branch: следовать `[FT-0141]` / `[EP-014]` и правилам из [Git flow](../../../../../spec/operations/git-flow.md).

## User value
Команда быстрее понимает, где лежит код конкретной возможности, как её безопасно менять и куда добавлять новые slices для следующих GUI-эпиков.

## Deliverables
- Зафиксированный target map feature areas для `packages/core`, `packages/api-contract`, `packages/client`, `packages/cli`, `apps/web`.
- Политика shared-модулей:
  - что можно выносить в `shared`,
  - что должно оставаться рядом с owning feature area,
  - какие модули считаются composition-only root entrypoints.
- Документированный rationale package:
  - `spec/project/feature-area-boundaries.md` как WHAT/ownership map,
  - `adr/0004-feature-area-slicing-boundaries.md` как WHY,
  - обновлённый `spec/c4/l3-components.md` как component-level view.
- Migration inventory текущего кода:
  - какие файлы и responsibilities переезжают,
  - какие root `index.ts`/dispatcher файлы должны похудеть,
  - какие import paths считаются legacy и должны исчезнуть к концу эпика.
- Обновление planning/docs SSoT под новую модель.

## Context (SSoT links)
- [Project structure](../../../../../structure.md): текущая карта слоёв и папок. Читать, чтобы refactor не конфликтовал с базовой repo layout.
- [Repo structure (target)](../../../../../spec/project/repo-structure.md): текущая целевая структура. Читать, чтобы не изобретать новую модель поверх уже зафиксированной.
- [Feature-area boundaries](../../../../../spec/project/feature-area-boundaries.md): целевые ownership boundaries между areas и правила для `shared`. Читать, чтобы не ограничиться только layout-level описанием.
- [Layers & vertical slices](../../../../../spec/project/layers-and-vertical-slices.md): definition of done для vertical slices. Читать, чтобы feature areas не нарушили слойность.
- [Architecture guardrails](../../../../../spec/engineering/architecture-guardrails.md): import boundaries и thin-clients discipline. Читать, чтобы новый layout усиливал guardrails, а не обходил их.
- [ADR 0004 — Feature-area slicing boundaries](../../../../../adr/0004-feature-area-slicing-boundaries.md): rationale выбора boundaries. Читать, чтобы doc package отвечал и на WHY, и на WHAT.
- [Implementation playbook](../../../../implementation-playbook.md): как связывать FT → code → tests → docs. Читать, чтобы сам refactor был проведён как нормальная delivery работа.
- [Documentation standards](../../../../../spec/engineering/documentation-standards.md): правила обновления Memory Bank без дублей и orphan references.

## Project grounding (mandatory before coding)
- [ ] FT-документ прочитан целиком.
- [ ] Прочитаны `repo-structure`, `layers-and-vertical-slices`, `architecture-guardrails`, `implementation-playbook`.
- [ ] Зафиксирован текущий inventory production-кода по `core` / `api-contract` / `client` / `cli` / `web`.
- [ ] Составлен список root entrypoints и shared helpers, которые сейчас перегружены ответственностями.
- [ ] Проверены planned эпики после EP-013, чтобы target structure соответствовала их будущим change surfaces.

## Implementation plan
- Описать canonical feature areas и ownership boundaries между ними.
- Разметить shared-модули по категориям:
  - shared errors/result plumbing,
  - shared auth/context resolution,
  - shared UI primitives and app shell,
  - shared testing helpers,
  - cross-slice policies only when they truly belong more than one area.
- Зафиксировать anti-patterns:
  - feature logic в root `index.ts`,
  - “utility” folders без ownership,
  - cross-imports между unrelated areas,
  - hidden business rules inside `cli` / `web` / client adapters.
- Обновить planning/navigation docs перед массовым кодовым переносом, чтобы следующие slices ссылались на новую структуру.

## Scenarios (auto acceptance)
### Setup
- Workspace в состоянии после завершения EP-013.
- Источники правды: `plans/`, `spec/project/`, `spec/engineering/`, `spec/ui/`.

### Action
1. Выполнить inventory current paths и целевых feature areas.
2. Проверить, что у каждой будущей feature area есть owning package paths и допустимые shared modules.
3. Обновить плановые документы, ссылки и numbering так, чтобы последующие эпики уже опирались на новую структуру.

### Assert
- Нет “серых зон”, где ответственность модуля не определена.
- Для каждого planned GUI эпика после EP-013 ясно, в каких feature areas будет лежать его код.
- Memory Bank не содержит устаревших ссылок на pre-refactor numbering/path model.

### Client API ops (v1)
- N/A: planning and architecture baseline slice.

## Manual verification (deployed environment)
N/A: planning/doc slice. Deployed verification требуется в FT-0143 после завершения реального кодового переноса.

## Tests
- Docs audit / link integrity checks.
- Search-based audit for stale epic/feature references and legacy target-path mentions.

## Docs updates (SSoT)
- [Plans index](../../../../index.md)
- [Roadmap](../../../../roadmap.md)
- [Epics catalog](../../../../epics.md)
- [Epic plans index](../../../index.md)
- [Verification matrix](../../../../verification-matrix.md)
- [Project index](../../../../../spec/project/index.md)
- [Feature-area boundaries](../../../../../spec/project/feature-area-boundaries.md)
- [ADR index](../../../../../adr/index.md)
- [ADR 0004 — Feature-area slicing boundaries](../../../../../adr/0004-feature-area-slicing-boundaries.md)
- [C4 L3 components](../../../../../spec/c4/l3-components.md)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
- [UI design references mapping](../../../../../spec/ui/design-references-stitch.md)

## Quality checks evidence (after implementation)
- Date: `2026-03-06`
- Checks run:
  - `pnpm --filter @feedback-360/core test -- --runInBand src/ft/ft-0141-feature-area-target-structure.test.ts`
  - `pnpm docs:audit`
- Result: passed.

## Acceptance evidence (after implementation)
- Date: `2026-03-06`
- Commands/tests run:
  - `pnpm --filter @feedback-360/core test -- --runInBand src/ft/ft-0141-feature-area-target-structure.test.ts`
  - `rg -n "src/slices|commands/<slice>|v1/<slice>|packages/core/src/slices|packages/cli/src/commands" .memory-bank packages apps/web`
  - `node scripts/audit-memory-bank.mjs --ep EP-014`
- Result: passed.

## CI/CD evidence (mandatory for runtime/deploy/integration changes)
- GitHub: N/A for planning-only slice unless merged together with executable tooling checks.
- Vercel: N/A.
