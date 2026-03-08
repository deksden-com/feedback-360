---
description: Catalog of cross-epic XE scenarios and related execution materials.
purpose: Read to navigate the executable product scenarios and their supporting documents.
status: Draft
date: 2026-03-09
parent: .memory-bank/plans/index.md
---


# XE scenarios — index
Status: Draft (2026-03-07)

Этот раздел — SSoT по cross-epic сценариям: что именно мы проверяем сквозным прогоном, какие phases у сценария и какие artifacts/evidence должны быть собраны.

- [XE foundation](../../spec/testing/xe-foundation.md) — базовая модель XE: run, state, seeds, phases, cleanup, environment guards. Читать, чтобы новые сценарии не придумывали свою механику запуска.
- [XE run model](../../spec/testing/xe-run-model.md) — lifecycle run-а и policy retry/cleanup. Читать, чтобы CLI и runner трактовали run одинаково.
- [XE scenario layout](../../spec/testing/xe-scenario-layout.md) — где лежат сценарные материалы и как связаны `scenario.json`, fixtures и phase handlers. Читать, чтобы сценарии были одинаково устроены.
- [XE CLI contract](../../spec/testing/xe-cli-contract.md) — минимальный, но полный каталог XE-команд. Читать, чтобы orchestration шёл через единый интерфейс.
- [XE JSON schemas](../../spec/testing/xe-json-schemas.md) — draft-формы `scenario.json`, `state.json` и `bindings.json`. Читать, чтобы сценарий и раннер использовали один формат.
- [XE runner package structure](../../spec/testing/xe-runner-package.md) — где живёт runtime раннера и где лежат scenario assets. Читать, чтобы код и сценарные материалы были разделены.
- [XE-001 First 360 campaign happy path](XE-001-first-campaign/index.md) — первый golden cross-epic сценарий: HR setup → start → invites → fills → results. Читать, чтобы реализовать первую полную сквозную проверку продукта.
- [XE-001 fixtures blueprint](XE-001-first-campaign/fixtures.md) — состав fixture-файлов и назначение каждого. Читать, чтобы не смешивать actor/seed/answers/results/UI ожидания.
- [XE-001 open points](XE-001-first-campaign/open-points.md) — конкретные remaining items перед кодированием сценария. Читать, чтобы implementation plan шёл по закрытому списку, а не по догадкам.
