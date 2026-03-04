# GS8 — Snapshot immutability (planned)
Status: Draft (2026-03-03)

## Setup
- Seed: `S5_campaign_started_no_answers` (campaign started, snapshot exists)

## Action
1) После старта меняем сотруднику department/manager в HR-справочнике.
2) Запрашиваем snapshot кампании до/после изменения.

## Assertions
- Snapshot кампании остаётся неизменным после изменения live HR-справочника.
- Live-история сотрудника меняется, но snapshot не пересчитывается.

## Client API ops (v1)
- `org.department.move` / `org.manager.set` (меняем справочник)
- `campaign.snapshot.list` (проверяем, что кампанию не “повело”)
- `matrix.generateSuggested` / results get (planned next slices)
