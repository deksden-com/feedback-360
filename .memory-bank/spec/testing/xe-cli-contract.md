# XE CLI contract
Status: Draft (2026-03-07)

Цель: дать AI-агенту и разработчику единый deterministic CLI для запуска, расследования и cleanup cross-epic сценариев.

## Design principles
- human-readable output и `--json` поддерживаются наравне;
- destructive XE-команды разрешены только в `local` и `beta`;
- CLI не хранит свою логику сценариев — он вызывает XE runner / typed client contract;
- каждая команда должна возвращать достаточно данных для orchestration без чтения БД вручную.

## Scenario catalog
- `xe scenarios list`
- `xe scenarios show <scenario-id>`

Назначение:
- посмотреть какие сценарии доступны;
- получить summary, version, allowed environments, phases и required fixtures.

## Run lifecycle
- `xe runs create <scenario-id>`
- `xe runs start <run-id>`
- `xe runs run <scenario-id>` — sugar: create + start
- `xe runs status <run-id>`
- `xe runs list`
- `xe runs delete <run-id>`
- `xe runs delete --expired`
- `xe runs delete --before <date>`
- `xe runs delete --since <date>`

Назначение:
- создать/запустить run;
- получить status/phase summary;
- удалить run или cleanup expired runs.

## Phase execution
- `xe phases list <run-id>`
- `xe phases run <run-id> <phase-id>`

MVP policy:
- основной путь — запуск полного run-а;
- `xe phases run` нужен для controlled debug/development и должен уважать failure policy фазы.

## Seeds
- `xe seeds list`
- `xe seeds show <seed-handle>`
- `xe seeds apply <seed-handle> --run <run-id>`

Назначение:
- inspect доступные именованные seeds;
- вручную применить seed к уже созданному run при отладке.

## Auth bootstrap
- `xe auth issue <run-id> --actor <actor-key> --format storage-state`
- `xe auth issue <run-id> --actor <actor-key> --format token`

MVP default:
- раннер и automation используют `storage-state`;
- `token` остаётся для ручной диагностики и специальных flows.

Token flow:
- CLI выпускает short-lived signed token для конкретного actor/run;
- login page на `local|beta` поддерживает manual XE token login;
- после обмена token → session пользователь работает как обычный logged-in actor, включая обычный logout.

## Assertions and artifacts
- `xe assertions run <run-id>`
- `xe artifacts dir <run-id>`
- `xe artifacts show <run-id>`

Назначение:
- принудительно прогнать assertions по текущему состоянию run-а;
- быстро найти workspace;
- получить artifact manifest.

## Notifications / side effects
- `xe notifications list <run-id>`

Назначение:
- inspect notification intents / test adapter deliveries, созданные сценарием.

## Lock
- `xe lock status`
- `xe lock release --force`

Назначение:
- посмотреть активный global XE lock;
- снять lock вручную после застрявшего run-а.
