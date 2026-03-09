---
description: Feature catalog for EP-020-cross-epic-scenarios.
purpose: Read to see the slice breakdown inside the epic and navigate to individual feature plans.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-020-cross-epic-scenarios/index.md
epic: EP-020
---


# EP-020 — Feature catalog
Status: Completed (2026-03-07)

- [FT-0201 XE run lifecycle and cleanup](FT-0201-xe-run-lifecycle/index.md): registry run-ов, workspace, TTL, explicit delete/cleanup и запрет XE в `prod`. Читать, чтобы сценарные запуски были управляемыми и безопасными; статус — completed с CLI/DB evidence.
- [FT-0202 Seed subsystem and named seeds](FT-0202-seed-subsystem/index.md): `system seed` и именованные `seed`-наборы для фич и XE, с deterministic handles. Читать, чтобы сценарии стартовали из воспроизводимого состояния; статус — completed с beta bindings evidence.
- [FT-0203 Test adapters and auth bootstrap](FT-0203-test-adapters-auth-bootstrap/index.md): test notification adapter, controlled async stubs и test-only auth/session bootstrap. Читать, чтобы сценарии не зависели от внешних систем и GUI login flow; статус — completed с session/notification artifacts.
- [FT-0204 XE CLI](FT-0204-xe-cli/index.md): развитое CLI-управление сценариями, run-ами, seeds, assertions и cleanup. Читать, чтобы агенту было просто исполнять сценарии; статус — completed с vitest + real runs evidence.
- [FT-0205 Scenario spec and phase runner](FT-0205-scenario-runner/index.md): spec + phase handlers + state/artifacts/assertions. Читать, чтобы сценарии были исполнимыми, а не “только документами”; статус — completed с local/beta run state evidence.
- [FT-0206 UI automation contract](FT-0206-ui-automation-contract/index.md): screen specs, POM, `data-testid`, session strategy и артефакты GUI-фаз. Читать, чтобы GUI-часть сценариев была стабильной; статус — completed с screenshots from `XE-001`.
- [FT-0207 XE-001 first campaign happy path](FT-0207-xe-001-first-campaign/index.md): первый полный cross-epic сценарий. Читать, чтобы подтвердить, что foundation действительно работает; статус — completed с local + beta passed runs.
