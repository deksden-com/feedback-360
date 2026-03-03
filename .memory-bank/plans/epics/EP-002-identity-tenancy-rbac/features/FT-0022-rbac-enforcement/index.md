# FT-0022 — RBAC enforcement (roles × actions)
Status: Draft (2026-03-03)

## User value
Каждый видит и делает только то, что положено по роли; HR Reader в MVP читает raw open text, но не может менять данные.

## Deliverables
- RBAC checks на операциях (server-side).
- Явные error codes (`forbidden`) для запретных операций.

## Context (SSoT links)
- [RBAC spec](../../../../../spec/security/rbac.md): роли и принципиальная матрица. Читать, чтобы тесты и реализация проверяли одни и те же “права”.
- [Results visibility](../../../../../spec/domain/results-visibility.md): кто видит raw open text vs processed. Читать, чтобы исключение “HR Reader видит raw (MVP)” было реализовано осознанно.
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): ops и роли доступа (ориентир). Читать, чтобы RBAC применялся на уровне операций, а не в UI/CLI.
- [Error model](../../../../../spec/client-api/errors.md): `forbidden` и shape ошибок. Читать, чтобы сценарии проверяли коды стабильно.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист реализации. Читать, чтобы RBAC enforcement был покрыт интеграционными тестами.

## Acceptance (auto)
### Setup
- Seed: `S1_company_roles_min --json` (planned; содержит hr_admin и hr_reader).

### Action (integration test)
1) В auth context роли `hr_reader` вызвать write-операцию, например `campaign.weights.set`.
2) В auth context роли `hr_reader` вызвать read-операцию `results.getHrView` на completed кампании.

### Assert
- (1) возвращает typed error `code=forbidden`.
- (2) разрешено и включает raw open text (MVP исключение).

### Client API ops (v1)
- `campaign.weights.set`
- `results.getHrView`

## Implementation plan (target repo)
- RBAC как middleware/политика на операции:
  - На входе операции определить роль из membership (по `user_id` + active company).
  - Сопоставить op → required roles (SSoT: operation catalog + RBAC doc).
  - При запрете возвращать typed error `code=forbidden` без частичных изменений.
- Raw open text:
  - Реализовать “MVP исключение”: `hr_reader` имеет доступ к raw open text в HR-витрине результатов, но не имеет write ops.
  - Зафиксировать это в тестах (и позже легко отключить/изменить).
- Тонкие моменты:
  - Ошибка должна быть одинаковой для HTTP/in-proc/CLI (один источник правды).
  - “Нет membership” и “роль не подходит” маппим в `forbidden` (а не “пустые данные”).

## Tests
- Integration: матрица “write запрещено” для `hr_reader` на примере `campaign.weights.set`.
- Integration: `results.getHrView` для `hr_reader` включает raw open text (MVP).
- Contract: `forbidden` error code стабилен.

## Memory bank updates
- При расширении матрицы до уровня ops обновить: [RBAC spec](../../../../../spec/security/rbac.md) — SSoT разрешений. Читать, чтобы новые операции не остались без политики.

## Verification (must)
- Automated test: `packages/core/test/ft/ft-0022-rbac.test.ts` (integration) проверяет `forbidden` на write ops и разрешённый HR-read.
- Must run: GS4 должен быть зелёным (включая кейсы HR Reader read-only).
