---
description: Feature catalog for EP-014-feature-area-slices-refactor.
purpose: Read to see the slice breakdown inside the epic and navigate to individual feature plans.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-014-feature-area-slices-refactor/index.md
epic: EP-014
---


# EP-014 — Feature catalog
Status: Completed (2026-03-06)

- [FT-0141 Feature-area target structure and shared-module policy](FT-0141-target-structure-shared-policy/index.md): фиксируем целевую карту feature areas, правила shared-кода и migration inventory. Читать, чтобы перенос опирался на явную модель, а не на локальные решения “по ходу”.
- [FT-0142 Core/contract/client/cli extraction by feature areas](FT-0142-backend-client-extraction/index.md): переносим серверную и automation-часть в slices без изменения поведения. Читать, чтобы главный maintenance выигрыш появился там, где сейчас больше всего god-files и сквозных зависимостей.
- [FT-0143 Web/lib realignment, docs sync and deployment proof](FT-0143-web-docs-deploy-proof/index.md): доводим web/lib, Memory Bank, verification и beta smoke до консистентного состояния. Читать, чтобы после refactor продукт остался рабочим не только локально, но и на `beta`.
