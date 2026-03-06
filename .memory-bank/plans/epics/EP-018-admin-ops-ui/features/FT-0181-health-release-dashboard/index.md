# FT-0181 — Health and release dashboard
Status: Planned (2026-03-06)

## User value
Команда быстро видит, в каком состоянии beta/prod, какой build задеплоен и прошёл ли последний smoke.

## Deliverables
- Environment health cards.
- Build/deploy metadata.
- Latest CI/smoke status panel.

## Context (SSoT links)
- [Deployment architecture](../../../../../spec/operations/deployment-architecture.md): beta/prod topology and ownership. Читать, чтобы dashboard показывал правильные environments.
- [Runbook](../../../../../spec/operations/runbook.md): operational checks and release path. Читать, чтобы UI signals matched runbook language.
- [Stitch mapping — EP-018](../../../../../spec/ui/design-references-stitch.md#ep-018--admin-and-ops-ui): generic dashboard/status patterns.

## Project grounding
- Проверить what health/build/smoke metadata already available.
- Свериться with existing CI/beta smoke evidence.

## Implementation plan
- Add ops dashboard page.
- Surface deployment/build metadata and latest smoke result.
- Link to deeper runbook steps when something is red.

## Scenarios (auto acceptance)
### Setup
- Local mocked health/deploy data.

### Action
1. Open ops dashboard.
2. Refresh/reload state.

### Assert
- Build SHA and environment shown.
- Smoke status visible.
- Red state clearly distinguishable.

### Client API ops (v1)
- Health/deploy/CI status read adapters.

## Manual verification (deployed environment)
- `beta`: compare ops dashboard with Vercel/GitHub status for the same build.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
