# Project structure (repo layout)
Status: Updated (2026-03-06)

Цель: описать структуру репозитория по папкам и границы ответственности, чтобы:
- слои были соблюдены (core/адаптеры/клиенты),
- vertical slices “сшивались” через contract + typed client,
- бизнес-логика не утекала в UI/CLI.

Связанные документы (аннотированные ссылки):
- [Repo structure (target)](spec/project/repo-structure.md): целевая структура монорепо и рекомендуемые пакеты. Читать, чтобы понимать “куда что класть” на уровне packages/apps.
- [Layers & vertical slices](spec/project/layers-and-vertical-slices.md): правила слоёв и DoD вертикального слайса. Читать, чтобы фичи завершались проверяемыми deliverables (contract→core→db→cli→tests→docs).

## Top-level
- `AGENTS.md`: правила для ИИ агентов и краткий системный контекст. Читать перед крупными изменениями, чтобы не нарушить ключевые ограничения.
- `.memory-bank/`: SSoT документации проекта (spec/adr/plans) + assets/evidence. Читать/обновлять при изменении требований, решений, планов и visual references.
- `.xe-runs/`: runtime workspaces cross-epic сценариев. Не SSoT; хранит state/artifacts конкретных run-ов до cleanup/TTL.
- `README.md`: краткая точка входа для людей (ссылка на меморибанк).
- `scenarios/`: каталог executable scenario materials (`scenario.json`, fixtures, phase-specific docs/skills). Читать, чтобы менять именно сценарий, а не общий runner.

## Memory bank structure
- `.memory-bank/spec/`: WHAT — нормативные требования и ограничения.
  - `spec/ui/screens/`: screen specs по отдельным экранам.
  - `spec/ui/pom/`: mapping screen specs → automation/POM/test ids.
  - `spec/testing/xe-*.md`: нормативные правила XE run/scenario model.
- `.memory-bank/guides/`: пользовательские документы в стиле Diátaxis (`tutorials/`, `how-to/`, `explanation/`, `reference/`). Храним здесь operational/product docs “как пользоваться”, не дублируя нормативные правила из `spec/`.
- `.memory-bank/plans/`: roadmap, эпики/фичи, acceptance сценарии и verification matrix.
  - `plans/xe/`: каталог cross-epic сценариев и их фаз.
- `.memory-bank/adr/`: WHY — архитектурные решения.
- `.memory-bank/mbb/`: правила ведения меморибанка и шаблоны.
- `.memory-bank/assets/`: non-SSoT visual references и вспомогательные материалы.
- `.memory-bank/evidence/`: доказательства реализации и проверки фич (скриншоты, логи, snapshots).

## Apps (delivery)
- `apps/web/`: Next.js UI + route handlers. UI не содержит доменных правил; вызывает typed client.
  - `src/features/`: feature-area UI/server helpers (`app-shell`, `identity-tenancy`, `campaigns`, `questionnaires`, `results`).
  - `src/components/ui/`: UI primitives.
  - `src/lib/*`, `src/components/*`, `src/app/results/_shared.tsx`: временные compatibility shims, которые только re-export-ят из `src/features/*`.

## Packages (layers)
- `packages/core/`: use-cases/policies/state machines/calculators (вся бизнес-логика).
  - `src/features/*`: owning feature-area handlers.
  - `src/shared/*`: truly shared dispatch/context helpers.
  - `src/index.ts`: thin composition/dispatch entrypoint.
- `packages/api-contract/`: типизированный контракт операций/DTO/ошибок (версионируемый).
  - `src/<area>.ts`: feature-area contract entrypoints.
  - `src/v1/legacy.ts`: переходный внутренний runtime/schema layer, пока deeper split не завершён.
  - `src/index.ts`: thin aggregate export surface.
- `packages/client/`: typed client поверх contract (HTTP и/или in-proc) для UI/CLI.
  - `src/features/*`: client methods grouped by feature area.
  - `src/shared/runtime.ts`: transport/runtime plumbing.
  - `src/index.ts`: thin composer.
- `packages/cli/`: Commander CLI поверх client (human + `--json`).
  - `src/index.ts`: thin CLI entrypoint.
  - `src/legacy.ts`: переходный registry/module с существующими командами; новые feature slices не должны наращивать его бесконтрольно.
- `packages/db/`: Drizzle schema/migrations + seed scenarios (fixtures).
- `packages/xe-runner/`: runtime XE runner, scenario registry, phase execution, artifacts/state helpers.
- `packages/testkit/`: builders/fixtures/helpers для тестов (без доменных правил).
- `packages/config/`: общие конфиги (tsconfig/biome/vitest).

## Tests (by level)
- Core unit: рядом с `packages/core/` (policy/calculator/transitions).
- Integration: поднимаем БД, прогоняем миграции/seed, проверяем use-cases.
- E2E: Playwright в `apps/web/` (минимальные golden flows).
