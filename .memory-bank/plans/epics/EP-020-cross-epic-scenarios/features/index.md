# EP-020 — Feature catalog
Status: Draft (2026-03-07)

- [FT-0201 XE run lifecycle and cleanup](FT-0201-xe-run-lifecycle/index.md): registry run-ов, workspace, TTL, explicit delete/cleanup и запрет XE в `prod`. Читать, чтобы сценарные запуски были управляемыми и безопасными.
- [FT-0202 Seed subsystem and named seeds](FT-0202-seed-subsystem/index.md): `system seed` и именованные `seed`-наборы для фич и XE, с deterministic handles. Читать, чтобы сценарии стартовали из воспроизводимого состояния.
- [FT-0203 Test adapters and auth bootstrap](FT-0203-test-adapters-auth-bootstrap/index.md): test notification adapter, controlled async stubs и test-only auth/session bootstrap. Читать, чтобы сценарии не зависели от внешних систем и GUI login flow.
- [FT-0204 XE CLI](FT-0204-xe-cli/index.md): развитое CLI-управление сценариями, run-ами, seeds, assertions и cleanup. Читать, чтобы агенту было просто исполнять сценарии.
- [FT-0205 Scenario spec and phase runner](FT-0205-scenario-runner/index.md): spec + phase handlers + state/artifacts/assertions. Читать, чтобы сценарии были исполнимыми, а не “только документами”.
- [FT-0206 UI automation contract](FT-0206-ui-automation-contract/index.md): screen specs, POM, `data-testid`, session strategy и артефакты GUI-фаз. Читать, чтобы GUI-часть сценариев была стабильной.
- [FT-0207 XE-001 first campaign happy path](FT-0207-xe-001-first-campaign/index.md): первый полный cross-epic сценарий. Читать, чтобы подтвердить, что foundation действительно работает.
