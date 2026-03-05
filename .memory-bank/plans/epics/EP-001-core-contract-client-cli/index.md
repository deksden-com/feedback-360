# EP-001 — Core + Contract + Client + CLI-first
Status: Completed (2026-03-04)

## Goal
Единый слой операций: core use-cases + typed contract + typed client + CLI, чтобы все сценарии можно было выполнять без UI.

## Features (vertical slices)
- [Feature catalog](features/index.md): список фич EP-001 с acceptance сценариями. Читать, чтобы собрать core+contract+client+cli без расхождений.

## Deliverables
- SSoT operation catalog реализуем в `v1` и поддерживаем `--json` в CLI.
- HTTP и in-proc транспорт не расходятся по поведению.

## Scenarios / tests
- GS1/GS5/GS6 должны выполняться только через CLI/client ops (кроме webhook security).

## Progress report (evidence-based)
- `as_of`: 2026-03-04
- `total_features`: 3
- `completed_features`: 3
- `evidence_confirmed_features`: 3
- verification link:
  - [Verification matrix](../../verification-matrix.md) — execution evidence по EP-001. Читать, чтобы отслеживать подтверждённый прогресс по одному SSoT-источнику.

## Memory bank updates (after EP completion)
- Держать SSoT операций и команд синхронизированным с кодом: [Operation catalog](../../../spec/client-api/operation-catalog.md) — список ops и права. Читать, чтобы UI/CLI оставались тонкими и не “придумывали” обходные пути.
- Зафиксировать финальную форму ошибок и коды: [Error model](../../../spec/client-api/errors.md) — shape и HTTP/CLI mapping. Читать, чтобы acceptance сценарии проверяли одинаковые `code`.
- Обновить CLI спецификацию и примеры: [CLI spec](../../../spec/cli/cli.md) — правила human/`--json`. Читать, чтобы CLI оставался AI-friendly и детерминированным.
