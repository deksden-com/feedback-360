# XE run model
Status: Draft (2026-03-07)

`xe_run` — запись о конкретном запуске сценария.

## Что храним в БД
- `run_id`, `scenario_id`, `scenario_version`
- `status`
- `environment`
- `workspace_path`
- `created_at`, `started_at`, `finished_at`
- `expires_at`
- `cleanup_status`
- `summary_json` (краткий итог)
- опционально краткий `bindings_json`, если это упрощает cleanup/поиск

Полный runtime state раннера **не** является SSoT в БД.
Cleanup опирается только на **явно зафиксированные traces run-а**. Эвристики, fallback-поиск по префиксам или “попробовать удалить всё похожее” запрещены.

## Что храним в файловом workspace
- `run.json`
- `state.json`
- `phase-*/*`
- artifacts/screenshots/db-slices/assertions

Workspace имеет вид:

```text
.xe-runs/
  RUN-20260307-001__XE-001-first-campaign/
    run.json
    state.json
    phase-01-seed/
    phase-02-hr-setup/
    ...
```

## Lifecycle
- `created`
- `running`
- `passed`
- `failed`
- `aborted`
- `cleaned`

## Создание и запуск
- `xe runs create <scenario-id>` — создаёт registry entry и workspace, ничего не исполняет.
- `xe runs start <run-id>` — запускает сценарий с первой фазы.
- `xe runs run <scenario-id>` — sugar: create + start.
- `xe runs resume <run-id>` — продолжает с первой неуспешной/неисполненной фазы.

## Cleanup
- `xe runs delete <run-id>` — удаляет workspace и очищает DB-следы run-а.
- `xe runs delete --expired`
- `xe runs delete --before <date>`
- `xe runs delete --since <date>`

Default TTL: `30 days` (configurable per environment).

Что считаем следами run-а:
- сущности, явно записанные в `bindings.json` / run registry;
- DB-артефакты, созданные подсистемами XE и явно связанные с `run_id`;
- файловые артефакты внутри workspace.

Что **не** делаем:
- не используем naming heuristics для удаления;
- не удаляем “похожие” сущности fallback-поиском;
- не чистим БД по префиксам имён как основному механизму.

Если после run-а остаётся мусор, это считаем дефектом трассировки: нужно добавить недостающие bindings/traces, а не усложнять cleanup эвристиками.

## Retry / rerun policy
Для MVP не вводим сложный “semantic rerun”.

Политика фазы указывается явно:
- `fail_run` — при ошибке run падает; продолжение запрещено.
- `rerun_with_reset` — допускается повтор только если раннер умеет откатить/восстановить состояние БД и workspace до checkpoint начала фазы.

По умолчанию для MVP используем `fail_run`: если прогон упал, создаём новый run. Неудачный run сохраняем для расследования и потом очищаем.

## Lock / concurrency policy
Concurrent XE-runs для MVP не поддерживаются.

Для `beta` используем простой registry lock:
- один активный global XE lock на окружение;
- lock получает `run_id`, `owner`, `acquired_at`, `expires_at`;
- default TTL lock: `2 hours`;
- lock регулярно продлевается раннером во время живого выполнения;
- при штатном завершении/aborted/delete lock снимается.

CLI должен поддерживать:
- `xe lock status`
- `xe lock release --force`

`--force` разрешён только для privileged XE operator path в `local`/`beta` и должен писать audit event.

## Assertions
Assertions — единый механизм проверок.
- фазовые assertions проверяют checkpoint после конкретной фазы;
- финальная фаза обычно содержит полную проверку сценария целиком.

Отдельную runtime-сущность для “global assertions” не вводим.
