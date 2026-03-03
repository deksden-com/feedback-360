# Architecture guardrails
Status: Draft (2026-03-03)

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
- `packages/core/src/slices/<slice>/...`
- `packages/api-contract/src/v1/<slice>/...`
- `packages/cli/src/commands/<slice>/...`

