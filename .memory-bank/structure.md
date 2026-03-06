# Project structure (repo layout)
Status: Draft (2026-03-03)

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
- `README.md`: краткая точка входа для людей (ссылка на меморибанк).

## Memory bank structure
- `.memory-bank/spec/`: WHAT — нормативные требования и ограничения.
- `.memory-bank/plans/`: roadmap, эпики/фичи, acceptance сценарии и verification matrix.
- `.memory-bank/adr/`: WHY — архитектурные решения.
- `.memory-bank/mbb/`: правила ведения меморибанка и шаблоны.
- `.memory-bank/assets/`: non-SSoT visual references и вспомогательные материалы.
- `.memory-bank/evidence/`: доказательства реализации и проверки фич (скриншоты, логи, snapshots).

## Apps (delivery)
- `apps/web/`: Next.js UI + route handlers. UI не содержит доменных правил; вызывает typed client.

## Packages (layers)
- `packages/core/`: use-cases/policies/state machines/calculators (вся бизнес-логика).
- `packages/api-contract/`: типизированный контракт операций/DTO/ошибок (версионируемый).
- `packages/client/`: typed client поверх contract (HTTP и/или in-proc) для UI/CLI.
- `packages/cli/`: Commander CLI поверх client (human + `--json`).
- `packages/db/`: Drizzle schema/migrations + seed scenarios (fixtures).
- `packages/testkit/`: builders/fixtures/helpers для тестов (без доменных правил).
- `packages/config/`: общие конфиги (tsconfig/biome/vitest).

## Tests (by level)
- Core unit: рядом с `packages/core/` (policy/calculator/transitions).
- Integration: поднимаем БД, прогоняем миграции/seed, проверяем use-cases.
- E2E: Playwright в `apps/web/` (минимальные golden flows).
