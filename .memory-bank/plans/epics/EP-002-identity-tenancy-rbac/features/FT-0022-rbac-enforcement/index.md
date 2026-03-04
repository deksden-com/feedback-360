# FT-0022 — RBAC enforcement (roles × actions)
Status: Completed (2026-03-04)

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

## Project grounding (2026-03-04)
- [x] Прочитан FT-документ целиком (deliverables, acceptance, tests, docs updates).
- [x] Прочитаны SSoT документы из `Context`.
- [x] Проверены [Operation catalog](../../../../../spec/client-api/operation-catalog.md) и [CLI command catalog](../../../../../spec/cli/command-catalog.md) для согласования прав на ops/команды.
- [x] Проверены [Traceability](../../../../../spec/testing/traceability.md) и GS4, чтобы покрыть RBAC subset без пересечения с FT-0021.
- [x] Зафиксированы слои реализации: `core` (RBAC проверки + tests), `spec` (ops role mapping), `plans/evidence`.

## Acceptance (auto)
### Setup
- Seed: `S5_campaign_started_no_answers --json` (для integration под DB URL).
- Роль тестового актора: `hr_reader` (контекст операции).

### Action (integration test)
1) В auth context роли `hr_reader` вызвать read-операцию `questionnaire.listAssigned`.
2) В auth context роли `hr_reader` вызвать write-операции `questionnaire.saveDraft`, `questionnaire.submit`, `company.updateProfile`.

### Assert
- (1) разрешено (`ok=true`) и возвращает список назначенных анкет.
- (2) каждая write-операция возвращает typed error `code=forbidden`.
- После запретных write-операций состояние анкеты не меняется (no partial changes).

### Client API ops (v1)
- `questionnaire.listAssigned`
- `questionnaire.saveDraft`
- `questionnaire.submit`
- `company.updateProfile`

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
- Unit/contract-style: `packages/core/src/ft/ft-0022-rbac-no-db.test.ts` проверяет, что `hr_reader` может read и получает `forbidden` на write без вызова DB-adapter write функций.
- Integration: `packages/core/src/ft/ft-0022-rbac.test.ts` (runIf DB URL) на `S5_campaign_started_no_answers` подтверждает запрет write и неизменность анкеты.
- Contract: `forbidden` code стабилен для write операций `questionnaire.saveDraft`, `questionnaire.submit`, `company.updateProfile`.

## Memory bank updates
- При расширении матрицы до уровня ops обновить: [RBAC spec](../../../../../spec/security/rbac.md) — SSoT разрешений. Читать, чтобы новые операции не остались без политики.

## Verification (must)
- Automated tests:
  - `packages/core/src/ft/ft-0022-rbac-no-db.test.ts`
  - `packages/core/src/ft/ft-0022-rbac.test.ts`
- Must run: GS4 RBAC subset должен быть зелёным (HR Reader read-only на текущем срезе ops).

## Quality checks evidence (2026-03-04)
- `pnpm -r lint` — passed
- `pnpm -r typecheck` — passed
- `pnpm -r test` — passed
- `build` — N/A (изменения покрыты unit/integration тестами, build-target не менялся).

## Acceptance evidence (2026-03-04)
- `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0022-rbac-no-db.test.ts` — passed.
- `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0022-rbac.test.ts` — passed (integration subtest skipped when DB URL absent).
