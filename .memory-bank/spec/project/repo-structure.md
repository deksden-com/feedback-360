# Repo structure (target)
Status: Draft (2026-03-03)

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

## Feature slicing (внутри core/contract)
Чтобы вертикальные слайсы не растворялись в “слоях”, используем соглашение:
- `packages/core/src/slices/<slice>/...` — use-cases и политики, сгруппированные по доменным слайсам (campaign, questionnaires, org, notifications, ai).
- `packages/api-contract/src/v1/<slice>/...` — операции/DTO, сгруппированные по тем же слайсам.

Подробная логика ownership boundaries и правил для `shared` живёт в:
- [Feature-area boundaries](feature-area-boundaries.md): какие области считаются canonical, где проходит граница ответственности и почему `shared` ограничен. Читать перед переносом модулей, чтобы не превратить slicing в хаотичную перекладку файлов.
- [ADR 0004 — Feature-area slicing boundaries](../../adr/0004-feature-area-slicing-boundaries.md): rationale, почему выбраны именно такие области и почему root files должны быть thin composition points. Читать перед архитектурными изменениями, чтобы помнить WHY решения.

При этом “общие” вещи остаются общими:
- `ports/` (интерфейсы внешних зависимостей),
- `errors/` (общие коды ошибок),
- `policies/` (если политика меж-слайсовая, иначе держим рядом со слайсом).
