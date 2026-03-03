# FT-0032 — Snapshot on campaign start
Status: Draft (2026-03-03)

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
1) После старта изменить employee department/manager в справочнике (ops `org.department.move` / `org.manager.set`).
2) Запросить матрицу/результаты кампании (matrix/results ops).

### Assert
- Кампанийные данные (матрица/группы/отчёты) не изменились и продолжают использовать snapshot старта.

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
- Integration (GS8): изменить оргсправочник после start и убедиться, что матрица/результаты кампании не изменились.

## Memory bank updates
- Если меняется состав полей в snapshot — обновить: [Org structure](../../../../../spec/domain/org-structure.md) — SSoT состава данных. Читать, чтобы автогенерация и отчёты оставались согласованными.

## Verification (must)
- Automated test: `packages/core/test/ft/ft-0032-snapshot.test.ts` (integration) проверяет, что изменения справочника после start не меняют snapshot-based вычисления.
- Must run: GS8 должен быть зелёным.
