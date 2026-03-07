# XE runner package structure
Status: Draft (2026-03-07)

Цель: зафиксировать, как XE runner живёт в монорепо и как соотносится с каталогом `scenarios/`.

## Разделение ответственности
- `scenarios/` — сценарные материалы:
  - `scenario.md`
  - `scenario.json`
  - `fixtures/*`
  - `phases/*`
- XE runner package/app — общий runtime:
  - registry
  - workspace manager
  - phase execution orchestration
  - assertions runner
  - artifact manager
  - lock handling
  - integrations with typed client / automation layer

## Рекомендуемая структура

```text
packages/
  xe-runner/
    src/
      runner/
      registry/
      locks/
      artifacts/
      assertions/
      auth/
      notifications/
      sessions/
      db-slices/
      index.ts

scenarios/
  XE-001-first-campaign/
    scenario.md
    scenario.json
    fixtures/
    phases/
```

## Почему не всё в одном месте
- сценарий меняется чаще и должен быть локально видимым как бизнес-asset;
- runner — общая исполняющая платформа для всех сценариев;
- такое разделение уменьшает дублирование и не превращает каждый сценарий в mini-framework.

## DB slices
DB state snapshots рекомендуются через named extractors внутри runner package:
- `campaign summary extractor`
- `questionnaire summary extractor`
- `results summary extractor`
- `notifications summary extractor`

Не используем универсальный raw-dump как основной путь.
