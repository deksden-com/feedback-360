# Architecture guardrails
Status: Updated (2026-03-06)

## Guardrails (must)
- `apps/web` использует typed client API, не импортирует доменный core напрямую.
- `packages/cli` использует typed client API, не импортирует доменный core напрямую.
- Доменный core не зависит от Next.js/Commander/Resend SDK напрямую (только через ports/adapters).

## Vertical slices (how)
Цель — чтобы фича читалась “по вертикали”:
- Contract: операция + DTO (versioned).
- Core: use-case + policies.
- DB: миграции/seed.
- CLI: команда для вызова.
- Tests: unit/integration (+ e2e минимально).

Рекомендуемое соглашение путей (target):
- `packages/core/src/features/<area>.ts`
- `packages/client/src/features/<area>.ts`
- `packages/api-contract/src/<area>.ts`
- `apps/web/src/features/<area>/...`

Переходные исключения, зафиксированные EP-014:
- `packages/api-contract/src/v1/legacy.ts` допустим как internal transitional layer, пока runtime schemas/DTO internals не разложены глубже.
- `packages/cli/src/legacy.ts` допустим как transitional command registry, пока команды не вынесены в более тонкие feature-area modules.
- `apps/web/src/lib/*` и `apps/web/src/components/*` допустимы только как thin re-export shims на новые `src/features/*` модули.

Границы ownership и исключения для `shared` фиксируются отдельно:
- [Feature-area boundaries](../project/feature-area-boundaries.md): canonical feature areas, root composition points и boundary heuristics. Читать перед переносом модулей и добавлением новых slices.
- [ADR 0004 — Feature-area slicing boundaries](../../adr/0004-feature-area-slicing-boundaries.md): почему именно такие границы выбраны и почему не используем “folder per FT” или growing flat root files.

## Thin root / shim rule
- Root entrypoint допустим только как composition/export surface.
- Compatibility shim допустим только как прямой `export ... from ...` без новой product logic.
- Любая новая feature logic должна добавляться в owning feature area, а не в `legacy.ts`, `index.ts` или historical `lib/*` shim.
