---
description: Feature catalog for EP-009-test-release-hardening.
purpose: Read to see the slice breakdown inside the epic and navigate to individual feature plans.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-009-test-release-hardening/index.md
epic: EP-009
---


# EP-009 — Feature catalog
Status: Completed (2026-03-05)

- [FT-0091 DB integration isolation](FT-0091-db-integration-isolation/index.md): изоляция integration tests и deterministic cleanup/seeds. Читать, чтобы `pnpm -r test` не падал из-за гонок и shared состояния.
- [FT-0092 CI checks topology](FT-0092-ci-checks-topology/index.md): стабильный GitHub Actions `checks` lane с корректным разделением unit/integration/build. Читать, чтобы merge gate был надёжным и предсказуемым.
- [FT-0093 Beta smoke release gates](FT-0093-beta-smoke-release-gates/index.md): обязательные smoke-сценарии на `beta` для runtime/user-facing изменений. Читать, чтобы deploy подтверждал реальную работоспособность.
- [FT-0094 Docs and evidence sync](FT-0094-docs-evidence-sync/index.md): убрать статусный drift в меморибанке и сделать traceability обязательной частью закрытия фич. Читать, чтобы документация не отставала от кода.
