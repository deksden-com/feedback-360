# EP-009 — Test & release hardening
Status: Completed (2026-03-05)

## Goal
Сделать поставку фич предсказуемой: убрать flaky тесты, стабилизировать CI/CD гейты и зафиксировать релизный путь так, чтобы merge в `develop` и проверка `beta` были рутинной, а не ручной “экспедицией”.

## Features (vertical slices)
- [Feature catalog](features/index.md): список фич EP-009 с acceptance сценариями. Читать, чтобы hardening был разложен на проверяемые шаги, а не остался “общей задачей”.

## Scenarios / tests
- Стабильный `pnpm -r test` без ложных падений от shared DB / параллелизма.
- Обязательный `checks` статус в GitHub Actions для PR в `develop`.
- Обязательный `beta` smoke после deploy user-facing изменений.

## Progress report (evidence-based)
- `as_of`: 2026-03-05
- `total_features`: 4
- `completed_features`: 4
- `evidence_confirmed_features`: 4
- verification link:
  - [Verification matrix](../../verification-matrix.md) — execution evidence по EP-009. Читать, чтобы прогресс hardening фиксировался так же строго, как продуктовые фичи.

## Memory bank updates (after EP completion)
- Синхронизировать release gates и CI требования: [Delivery standards](../../../spec/engineering/delivery-standards.md) — что считаем готовностью фичи. Читать, чтобы локальные проверки, CI и deploy не расходились.
- Подтвердить test topology и правила DB integration lanes: [Testing standards](../../../spec/engineering/testing-standards.md) — уровни тестов и порядок запуска. Читать, чтобы не возвращались flaky регрессии.
- Обновить release/runbook шаги: [Runbook](../../../spec/operations/runbook.md) — как выкатываем и проверяем систему. Читать, чтобы процесс был одинаковым для всех агентов и людей.
