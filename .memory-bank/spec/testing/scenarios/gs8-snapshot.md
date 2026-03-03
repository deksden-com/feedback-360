# GS8 — Snapshot immutability (planned)
Status: Draft (2026-03-03)

## Setup
- Seed: `S5_campaign_started_no_answers` (campaign started, snapshot exists)

## Action
1) После старта меняем сотруднику department/manager в HR-справочнике.
2) Запрашиваем назначения/результаты кампании.

## Assertions
- Кампания продолжает использовать снапшот стартовых данных для назначений/групп и отчётов.

## Client API ops (v1)
- `org.department.move` / `org.manager.set` (меняем справочник)
- `matrix.generateSuggested` / results get (проверяем, что кампанию не “повело”)

