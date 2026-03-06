# ADR 0004 — Feature-area slicing boundaries
Status: Draft (2026-03-06)

## Context
К моменту завершения EP-013 проект уже имеет working vertical slices в плане и тестах, но production-код в значимой степени собран вокруг крупных root entrypoints и layer-oriented файлов. Это увеличивает стоимость сопровождения:
- ownership фичи читается не сразу,
- изменения размазываются по большим composition-файлам,
- следующая GUI wave рискует нарастить coupling поверх legacy layout.

При этом Memory Bank уже мыслит delivery как vertical slices, а planned эпики после EP-013 естественно группируются по устойчивым feature areas (`results`, `people/org`, `models/matrix`, `notifications`, `ops`).

## Decision
Мы принимаем feature-area slicing как целевую модель структуры кода для `core`, `api-contract`, `client`, `cli` и связанных web/lib modules.

Canonical feature areas:
- `identity-tenancy`
- `org`
- `models`
- `campaigns`
- `matrix`
- `questionnaires`
- `results`
- `notifications`
- `ai`

`shared` допускается только для модулей без одного очевидного owner и без самостоятельной product semantics.

Root entrypoints сохраняются, но только как thin composition points.

## Why not “one folder per FT”
Мы не режем код по `FT-*`, потому что:
- FT — это delivery unit, а не всегда стабильная область владения кодом;
- слишком мелкая нарезка ведёт к fragmentation и слабой discoverability;
- следующие product changes приходят по feature areas, а не по FT identifiers.

## Why not keep current layer-flat organization
Мы не сохраняем growing root files как основную форму организации, потому что:
- god-files ухудшают локальность изменений;
- ownership размывается;
- агентам и разработчикам сложнее увидеть “полный кусок” одной области.

## Consequences
Плюсы:
- change surfaces становятся локальнее;
- легче онбордить новых агентов/разработчиков;
- проще связать plans ↔ code ↔ tests ↔ docs;
- следующие GUI-эпики строятся на предсказуемой структуре.

Цена:
- потребуется массовый перенос путей и imports;
- нужен явный policy для `shared`;
- нужен синхронный docs refactor и cross-link discipline.

## Guardrails
- Сначала фиксируем boundaries и rationale в docs, потом переносим код.
- Structural refactor не должен менять public operation names, DTO shapes и business behavior без отдельного решения.
- WHAT фиксируем в `spec/project/*` и `spec/c4/*`.
- WHY фиксируем в ADR.
- HOW остаётся в коде, но с обязательной docs navigation через cross-links.
