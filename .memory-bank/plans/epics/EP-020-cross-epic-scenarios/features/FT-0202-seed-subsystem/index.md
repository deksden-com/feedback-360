# FT-0202 — Seed subsystem and named seeds
Status: Completed (2026-03-07)

Пользовательская ценность: инженер или AI-агент может переводить систему в предсказуемое начальное состояние для фичи или сквозного сценария без ручной подготовки данных.

Deliverables:
- `system seed`
- named `seed` catalog
- `extends: system` composition
- deterministic handles/bindings export
- seed cleanup as part of run deletion

Acceptance scenario:
- применить named seed поверх `system seed`
- проверить, что возвращены deterministic handles
- bindings сохранены в run state
- удаление run-а очищает созданные seed-артефакты из БД

## Progress note (2026-03-07)
- Добавлен named seed `XE-001-first-campaign`, который создаёт компанию, оргструктуру, пользователей, модель, кампанию, участников и матрицу с explicit bindings.
- Seed пишет bindings в run registry и `bindings.json`, чтобы последующие фазы и cleanup опирались только на явную трассировку.

## Quality checks evidence (2026-03-07)
- `pnpm --filter @feedback-360/db lint` → passed.
- `pnpm --filter @feedback-360/db typecheck` → passed.
- `pnpm --filter @feedback-360/db test` → passed.

## Acceptance evidence (2026-03-07)
- Automated:
  - `pnpm --filter @feedback-360/db exec vitest run src/ft/ft-0201-xe-run-lifecycle.test.ts` → passed.
  - `pnpm --filter @feedback-360/xe-runner exec vitest run src/ft-0205-scenarios.test.ts` → passed.
- Covered acceptance:
  - seed создаёт deterministic handles для actors/departments/competencies;
  - bindings сохраняются в run state и используются runner-ом дальше;
  - cleanup run-а не нуждается в эвристиках.
- Artifacts:
  - bindings snapshot.
    `[.memory-bank/evidence/EP-020/FT-0202/2026-03-07/beta-bindings.json](../../../../../evidence/EP-020/FT-0202/2026-03-07/beta-bindings.json)`
