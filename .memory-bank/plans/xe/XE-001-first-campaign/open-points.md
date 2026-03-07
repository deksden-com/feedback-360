# XE-001 open points before implementation
Status: Draft (2026-03-07)

Это не архитектурные gaps XE foundation, а конкретные недостающие pieces перед кодированием `XE-001`.

## Screen specs to add
До реализации сценария нужно добавить screen specs и POM mapping для:
- HR campaign detail / workbench
- manager team results
- HR results workbench

## Fixture numeric values
Нужно зафиксировать точные indicator scores и comments в `answers.json`, а затем вычислить canonical `expected-results.json`.

## Deterministic completion path
Нужно выбрать конкретную controlled команду для:
- end campaign
- AI stub completion

## CLI coverage confirmation
Перед реализацией надо подтвердить, что first XE MVP действительно покрывается командами:
- runs
- seeds
- auth
- assertions
- notifications
- lock

## Browser artifact policy
Нужно определить минимальный набор screenshots per successful run и on-failure extras (например HTML dump / trace).
