# FT-0202 — Seed subsystem and named seeds
Status: Draft (2026-03-07)

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
