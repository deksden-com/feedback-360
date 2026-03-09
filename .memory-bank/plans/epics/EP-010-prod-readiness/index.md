---
description: EP-010-prod-readiness epic plan, scope, progress, and evidence entrypoint.
purpose: Read to understand the user value, feature map, and completion state of this epic.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/epics/index.md
epic: EP-010
---


# EP-010 — Production readiness
Status: Completed (2026-03-06)

## Goal
Подготовить систему к спокойной эксплуатации в `prod`: понятные retention/privacy правила, наблюдаемость, отработанный runbook и воспроизводимый pre-release rehearsal.

## Features (vertical slices)
- [Feature catalog](features/index.md): список фич EP-010 с acceptance сценариями. Читать, чтобы production readiness была конкретной и проверяемой, а не “общим пожеланием”.

## Scenarios / tests
- Release rehearsal: migrate -> deploy -> smoke -> rollback/check.
- Observability drill: ошибка/вебхук/cron событие видны в логах/Sentry.
- Policy drill: понятно, кто и как видит/хранит raw vs processed comments.

## Progress report (evidence-based)
- `as_of`: 2026-03-06
- `total_features`: 4
- `completed_features`: 4
- `evidence_confirmed_features`: 4
- verification link:
  - [Verification matrix](../../verification-matrix.md) — execution evidence по EP-010. Читать, чтобы readiness подтверждалась доказательствами, а не ощущением.

## Memory bank updates (after EP completion)
- Зафиксировать операционный процесс: [Runbook](../../../spec/operations/runbook.md) — deploy/recovery/smoke. Читать, чтобы prod операции были воспроизводимы.
- Обновить privacy/retention правила: [Data retention & privacy](../../../spec/operations/data-retention-privacy.md) — кто что видит и как долго храним. Читать, чтобы эксплуатация соответствовала доменным обещаниям.
- Подтвердить observability baseline: [Deployment architecture](../../../spec/operations/deployment-architecture.md) и [Runbook](../../../spec/operations/runbook.md). Читать, чтобы мониторинг и окружения были синхронизированы.
