# FT-0206 — UI automation contract
Status: Draft (2026-03-07)

Пользовательская ценность: GUI-фазы сценариев управляются надёжно и не ломаются от незначительных визуальных изменений.

Deliverables:
- screen spec policy
- POM catalog policy
- `data-testid` naming convention
- browser session/profile strategy for XE actors
- artifact capture rules for GUI phases
- test-only auth bootstrap → browser session flow

Acceptance scenario:
- для ключевых экранов `XE-001` существуют screen spec + POM
- POM использует стабильные `data-testid`
- раннер может открыть две разные actor sessions последовательно без GUI login flow
