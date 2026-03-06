# Repo structure (target)
Status: Updated (2026-03-06)

Цель: структура монорепо, которая поддерживает:
- слои (core/адаптеры/клиенты),
- вертикальные слайсы (feature-by-feature),
- тестируемость (seed scenarios + CLI + e2e).

## Monorepo (pnpm workspace)
Рекомендуемая структура:
- `apps/web/` — Next.js App Router (UI + route handlers).
- `packages/core/` — доменная логика (use-cases, policies, расчёты).
- `packages/api-contract/` — типизированный контракт операций/DTO/ошибок (версионируемый).
- `packages/client/` — typed client поверх contract (HTTP и/или in-proc).
- `packages/cli/` — Commander CLI поверх client (human + `--json`).
- `packages/db/` — Drizzle schema/migrations + seed scenarios.
- `packages/testkit/` — builders/fixtures/helpers (не бизнес-логика).
- `packages/config/` — общие конфиги (tsconfig/biome/vitest).

## Feature slicing (текущее target-состояние после EP-014)
Чтобы вертикальные слайсы не растворялись в “слоях”, production-код группируется по feature areas:
- `packages/core/src/features/<area>.ts` — owning handlers/use-cases/policies по feature area; root `packages/core/src/index.ts` остаётся thin dispatcher.
- `packages/client/src/features/<area>.ts` — typed-client methods по тем же areas; root `packages/client/src/index.ts` только собирает runtime и feature modules.
- `packages/api-contract/src/<area>.ts` — публичные feature-area exports для contract surface; `packages/api-contract/src/index.ts` only re-exports aggregate contract. На 2026-03-06 runtime schemas ещё живут в `packages/api-contract/src/v1/legacy.ts` как переходный слой, но наружный surface уже разложен по areas.
- `apps/web/src/features/<area>/...` — owning UI/server-side helpers рядом с feature area; старые `src/lib/*`, `src/components/*`, `src/app/results/_shared.tsx` сохранены как thin compatibility shims.
- `packages/cli/src/index.ts` — thin CLI entrypoint; основной command wiring временно живёт в `packages/cli/src/legacy.ts` как transitional module. Следующие CLI slices должны вытеснять `legacy.ts`, а не расширять его.

Подробная логика ownership boundaries и правил для `shared` живёт в:
- [Feature-area boundaries](feature-area-boundaries.md): какие области считаются canonical, где проходит граница ответственности и почему `shared` ограничен. Читать перед переносом модулей, чтобы не превратить slicing в хаотичную перекладку файлов.
- [ADR 0004 — Feature-area slicing boundaries](../../adr/0004-feature-area-slicing-boundaries.md): rationale, почему выбраны именно такие области и почему root files должны быть thin composition points. Читать перед архитектурными изменениями, чтобы помнить WHY решения.

При этом “общие” вещи остаются общими:
- `packages/core/src/shared/*` / `packages/client/src/shared/*` — dispatch/runtime plumbing и context helpers без собственного product behavior.
- `packages/db/src/*`, `packages/testkit/src/*`, `packages/config/*` — infrastructure/test/config layers.
- `apps/web/src/components/ui/*` — UI primitives; не доменные helpers.

Текущее правило переходного периода:
- thin compatibility shim допустим, если он просто `re-export`-ит owning feature-area module;
- новый feature behavior нельзя добавлять в shim/legacy file — его кладём сразу в owning feature area.
