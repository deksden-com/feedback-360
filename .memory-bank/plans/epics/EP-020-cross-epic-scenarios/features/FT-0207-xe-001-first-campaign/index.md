# FT-0207 — XE-001 first campaign happy path
Status: Draft (2026-03-07)

Пользовательская ценность: система получает первый доказуемый сквозной сценарий, который проверяет основной пользовательский путь 360-кампании от HR setup до результатов.

Deliverables:
- scenario materials in `scenarios/XE-001-first-campaign/`
- fixtures for actors/org/answers/expected results
- local execution path
- beta execution path
- evidence bundle for successful run

Acceptance scenario:
- `XE-001` запускается через CLI на `local`
- сценарий создаёт компанию/оргструктуру/модель/кампанию
- actors получают session bootstrap и заполняют анкеты по fixture
- results совпадают с expected fixture
- тот же сценарий исполним на `beta` с теми же фазами и artifacts
