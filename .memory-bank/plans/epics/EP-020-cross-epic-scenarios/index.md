---
description: EP-020-cross-epic-scenarios epic plan, scope, progress, and evidence entrypoint.
purpose: Read to understand the user value, feature map, and completion state of this epic.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/epics/index.md
epic: EP-020
---


# EP-020 — Cross-epic scenarios (XE) foundation
Status: Completed (2026-03-07)

Цель: добавить в систему first-class поддержку сквозных cross-epic сценариев: run registry, seed orchestration, test-only adapters, XE CLI, phase runner и первый golden scenario `XE-001`.

## Why
- feature acceptance покрывает slices по отдельности, но не заменяет продуктовые сквозные проверки;
- XE должны работать в `local` и `beta`, не затрагивая `prod`;
- агенту нужен детерминированный интерфейс выполнения сценария через CLI и стабильные artifacts.

## Scope
- run registry + cleanup
- named seed orchestration
- notification/auth test bootstrap
- scenario registry + runner
- UI automation contract for scenarios
- первый сценарий `XE-001`

## Feature catalog
- [FT-0201 XE run lifecycle and cleanup](features/FT-0201-xe-run-lifecycle/index.md) — run registry, TTL, cleanup, no-concurrency policy. Читать, чтобы сценарии были управляемыми и очищаемыми.
- [FT-0202 Seed subsystem and named seeds](features/FT-0202-seed-subsystem/index.md) — system seed + named seeds + seed handles for XE. Читать, чтобы сценарии стартовали из предсказуемого состояния.
- [FT-0203 Test adapters and auth bootstrap](features/FT-0203-test-adapters-auth-bootstrap/index.md) — notification test adapter и test-only auth bootstrap for local/beta. Читать, чтобы XE не зависели от внешней почты и GUI login.
- [FT-0204 XE CLI](features/FT-0204-xe-cli/index.md) — команды `xe scenarios/runs/seeds/assertions/artifacts`. Читать, чтобы агент и разработчик управляли сценариями одинаково.
- [FT-0205 Scenario spec and phase runner](features/FT-0205-scenario-runner/index.md) — `scenario.json`, phase handlers, state/artifacts/assertions. Читать, чтобы сценарии были исполнимы и машиночитаемы.
- [FT-0206 UI automation contract](features/FT-0206-ui-automation-contract/index.md) — screen specs, POM, `data-testid`, browser session strategy. Читать, чтобы XE GUI steps были стабильными.
- [FT-0207 XE-001 first campaign happy path](features/FT-0207-xe-001-first-campaign/index.md) — первый end-to-end cross-epic run на local и beta. Читать, чтобы доказать жизнеспособность XE foundation.

## Progress report (evidence-based)
- `as_of`: 2026-03-07
- `total_features`: 7
- `completed_features`: 7
- `evidence_confirmed_features`: 7
- verification link:
  - [Verification matrix](../../verification-matrix.md): local + beta execution evidence по XE lifecycle, CLI, runner и `XE-001`. Читать, чтобы считать epic закрытым только по фактам прогонов.

## Definition of done
- XE runs создаются, блокируются по environment и чистятся только по explicit bindings.
- Named seed и auth bootstrap позволяют запускать детерминированные cross-epic сценарии без внешней почты.
- `XE-001` проходит локально и на `beta`, сохраняет artifacts и даёт воспроизводимый evidence bundle.

## Current status
- Closed:
  - [FT-0201 XE run lifecycle and cleanup](features/FT-0201-xe-run-lifecycle/index.md): registry, lock, cleanup и TTL работают через DB + workspace.
  - [FT-0202 Seed subsystem and named seeds](features/FT-0202-seed-subsystem/index.md): именованные seed-ы создают deterministic bindings и чистятся вместе с run-ом.
  - [FT-0203 Test adapters and auth bootstrap](features/FT-0203-test-adapters-auth-bootstrap/index.md): scenario sessions и notification evidence доступны без real email loop.
  - [FT-0204 XE CLI](features/FT-0204-xe-cli/index.md): сценариями можно управлять из одного CLI surface.
  - [FT-0205 Scenario spec and phase runner](features/FT-0205-scenario-runner/index.md): `scenario.json` + phase handlers + file state стали исполнимым runtime.
  - [FT-0206 UI automation contract](features/FT-0206-ui-automation-contract/index.md): `screen spec + POM + storage-state per actor` зафиксированы и используются в runner.
  - [FT-0207 XE-001 first campaign happy path](features/FT-0207-xe-001-first-campaign/index.md): первый golden scenario passed в `local` и `beta`.

## Completion note (2026-03-07)
- EP-020 закрыт полностью:
  - в `packages/db` появились XE registry tables, lock/cleanup и named seed orchestration;
  - в монорепо добавлен `packages/xe-runner/` и каталог `scenarios/` как first-class scenario runtime;
  - CLI получил `xe scenarios/runs/phases/seeds/auth/artifacts/notifications/lock` commands;
  - `XE-001` отрабатывает end-to-end локально и на `https://beta.go360go.ru`, а artifacts копируются в evidence bundle;
  - failed runs больше не удаляются автоматически, что соответствует agreed investigation policy.
