# FT-0205 — Scenario spec and phase runner
Status: Draft (2026-03-07)

Пользовательская ценность: сценарии становятся исполнимыми asset-ами: их можно запускать, дебажить и изменять через fixtures без переписывания раннера.

Deliverables:
- `scenario.json`
- phase handlers in code
- file-based run state
- explicit `bindings.json`
- required/optional artifacts per phase
- assertions engine
- retry policy per phase (`fail_run` / `rerun_with_reset`)

Acceptance scenario:
- runner читает `scenario.json`
- выполняет phases последовательно
- сохраняет bindings/state/artifacts
- при ошибке фазы с policy `fail_run` run падает и сохраняет evidence
