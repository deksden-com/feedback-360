# FT-0032 — Snapshot on campaign start
Status: Completed (2026-03-04)

## User value
Кампания фиксирует оргсостояние на момент старта; дальнейшие изменения справочника не ломают отчёты и назначения кампании.

## Deliverables
- Snapshot таблица/сущность на `campaign.start`.
- Все назначения/группы/отчёты кампании опираются на snapshot.

## Context (SSoT links)
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): когда и что “замораживаем” при старте кампании. Читать, чтобы snapshot делался в правильный момент.
- [Org structure](../../../../../spec/domain/org-structure.md): какие поля оргструктуры считаются значимыми. Читать, чтобы snapshot включал нужные атрибуты (dept/manager/title/role flags).
- [Assignments & matrix](../../../../../spec/domain/assignments-and-matrix.md): матрица опирается на direct-manager из snapshot. Читать, чтобы после старта изменения справочника не меняли назначения.
- [GS8 Snapshot immutability](../../../../../spec/testing/scenarios/gs8-snapshot.md): golden сценарий неизменяемости. Читать, чтобы acceptance тест не был “слабым”.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист реализации. Читать, чтобы snapshot был покрыт integration тестами и seeds.

## Acceptance (auto)
### Setup
- Seed: `S5_campaign_started_no_answers --json` (campaign started, snapshot exists).

### Action
1) Считать snapshot кампании (`campaign.snapshot.list`).
2) После старта изменить employee department/manager в справочнике (ops `org.department.move` / `org.manager.set`).
3) Повторно считать snapshot кампании (`campaign.snapshot.list`).

### Assert
- Snapshot кампании не изменился после изменения live HR-справочника.
- Live история сотрудника изменилась (новые интервалы department/manager), но snapshot остался прежним.

## Implementation plan (target repo)
- DB:
  - Создать таблицу snapshot (например `campaign_employee_snapshots`) с:
    - ссылкой на campaign,
    - ссылкой на employee,
    - копией нужных полей (dept, manager, title, базовые role flags, email/telegram ids при необходимости).
- Core:
  - В `campaign.start` в одной транзакции:
    - валидировать статус `draft`,
    - создать snapshots для участников,
    - установить `campaign.status=started`.
  - Любые вычисления “кто чей руководитель/коллега” после start должны читать snapshot, а не “live HR directory”.
- Тонкие моменты:
  - Snapshot не обновляется после start (даже если employee сменил отдел/руководителя).
  - При soft delete employee в справочнике — snapshot и исторические данные кампании остаются.

## Tests
- Integration (GS8): изменить оргсправочник после start и убедиться, что snapshot кампании не изменился.
- Automated tests:
  - `packages/core/src/ft/ft-0032-snapshot-no-db.test.ts`
  - `packages/core/src/ft/ft-0032-snapshot.test.ts`
  - `packages/cli/src/ft-0032-campaign-snapshot-cli.test.ts`

## Memory bank updates
- Если меняется состав полей в snapshot — обновить: [Org structure](../../../../../spec/domain/org-structure.md) — SSoT состава данных. Читать, чтобы автогенерация и отчёты оставались согласованными.

## Verification (must)
- Must run: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test`, targeted FT-0032 acceptance tests.

## Project grounding (2026-03-04)
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): правило, что snapshot формируется на старте и дальше неизменяем.
- [Org structure](../../../../../spec/domain/org-structure.md): какие орг-атрибуты нужно фиксировать в snapshot.
- [GS8 Snapshot immutability](../../../../../spec/testing/scenarios/gs8-snapshot.md): целевой сценарий проверки неизменяемости.
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): актуальный список ops и RBAC.
- [CLI command catalog](../../../../../spec/cli/command-catalog.md): 1:1 команды к ops для acceptance проверок.

## Quality checks evidence (2026-03-04)
- `pnpm -r lint` → passed.
- `pnpm -r typecheck` → passed.
- `pnpm -r test` → passed.
- Build: N/A (изменения только в `packages/*`, отдельного build-gate для FT-0032 нет).

## Acceptance evidence (2026-03-04)
- `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0032-snapshot-no-db.test.ts src/ft/ft-0032-snapshot.test.ts` → passed (`ft-0032-snapshot.test.ts`: integration subtest skipped без `SUPABASE_DB_POOLER_URL`/`DATABASE_URL`).
- `pnpm --filter @feedback-360/cli exec vitest run src/ft-0032-campaign-snapshot-cli.test.ts` → passed.
- Проверено по acceptance intent: после `org.department.move` + `org.manager.set` live-история изменилась, а `campaign.snapshot.list` вернул неизменный snapshot.
