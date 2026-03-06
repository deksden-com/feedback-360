# FT-0101 — Retention and privacy policy finalization
Status: Draft (2026-03-05)

## User value
HR, руководители и сотрудники работают по понятным правилам хранения и видимости данных; у команды нет “серой зоны” по raw comments, soft delete и срокам хранения.

## Deliverables
- Финализированный документ retention/privacy policy.
- Явные решения по raw/processed comments, soft delete, archival/deletion lifecycle.
- Если нужно — технические follow-up tasks на enforcement.

## Context (SSoT links)
- [Data retention & privacy](../../../../../spec/operations/data-retention-privacy.md): текущий draft и открытый риск по retention. Читать, чтобы закрыть именно незавершённые policy-решения.
- [Results visibility](../../../../../spec/domain/results-visibility.md): кто видит raw vs processed. Читать, чтобы privacy policy совпадала с product behavior.
- [RBAC](../../../../../spec/security/rbac.md): роль HR Reader и правила доступа к HR view. Читать, чтобы policy и access model не расходились.

## Acceptance (auto/process)
### Setup
- Есть текущая draft policy и текущая реализация visibility.

### Action
1) Принять policy decisions и обновить SSoT docs.
2) Обновить runtime behavior для `hr_reader`/`hr_admin`, если policy требует изменений.
3) Проверить, что policy не противоречит текущим тестам и role behavior.

### Assert
- В docs нет открытой неопределённости по retention срокам и raw access.
- Policy согласована с RBAC/results visibility.
- Policy согласована и с docs, и с runtime behavior.

## Implementation plan (target repo)
- Провести policy sweep по ops/security/domain docs.
- Зафиксировать canonical decisions.
- Обновить glossary/terminology при необходимости.
- Обновить runtime shaping `results.getHrView` и HR UI, если policy требует сужения raw access.

## Tests
- Docs consistency review.
- Targeted tests на role visibility (`hr_reader` без raw, `hr_admin` с raw).

## Memory bank updates
- Обновить [Data retention & privacy](../../../../../spec/operations/data-retention-privacy.md), [Results visibility](../../../../../spec/domain/results-visibility.md), [RBAC](../../../../../spec/security/rbac.md), [Glossary](../../../../../spec/glossary.md).

## Verification (must)
- Docs review with resolved open questions.
- Must run: consistency check against current role/result tests.

## Manual verification (deployed environment)
- Environment:
  - target: `beta` after deploy to `develop`
  - Date: `2026-03-06`
- Steps:
  1. Подготовить completed campaign dataset.
  2. Открыть HR results view как `hr_reader` и проверить отсутствие raw text.
  3. Открыть HR results view как `hr_admin` и проверить наличие raw text.
- Expected:
  - `hr_reader` получает только processed/summary,
  - `hr_admin` получает raw + processed + summary.
