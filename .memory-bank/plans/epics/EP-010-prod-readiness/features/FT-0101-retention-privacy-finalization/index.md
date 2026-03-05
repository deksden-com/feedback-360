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
- [RBAC](../../../../../spec/security/rbac.md): роль HR Reader и доступ к raw в MVP. Читать, чтобы policy и access model не расходились.

## Acceptance (auto/process)
### Setup
- Есть текущая draft policy и текущая реализация visibility.

### Action
1) Принять policy decisions и обновить SSoT docs.
2) Проверить, что policy не противоречит текущим тестам и role behavior.
3) Зафиксировать enforcement backlog, если policy требует кода позже.

### Assert
- В docs нет открытой неопределённости по retention срокам и raw access.
- Policy согласована с RBAC/results visibility.
- Если есть gap между policy и кодом, он явно записан как отдельная FT.

## Implementation plan (target repo)
- Провести policy sweep по ops/security/domain docs.
- Зафиксировать canonical decisions.
- Обновить glossary/terminology при необходимости.
- Если policy changes требуют кода, оформить отдельные FT, а не смешивать с policy doc.

## Tests
- Docs consistency review.
- При необходимости — targeted tests на role visibility.

## Memory bank updates
- Обновить [Data retention & privacy](../../../../../spec/operations/data-retention-privacy.md), [Results visibility](../../../../../spec/domain/results-visibility.md), [RBAC](../../../../../spec/security/rbac.md), [Glossary](../../../../../spec/glossary.md).

## Verification (must)
- Docs review with resolved open questions.
- Must run: consistency check against current role/result tests.

## Manual verification (deployed environment)
N/A — policy/documentation first.
