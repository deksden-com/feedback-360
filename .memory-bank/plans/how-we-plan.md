# How we plan epics & features
Status: Draft (2026-03-03)

Цель: чтобы “план” был пригоден для исполнения и тестирования, а не списком хотелок.

## Units
- **Epic**: крупная тема, объединяющая фичи (вертикальные слайсы).
- **Feature**: минимально полезная поставка, которую можно проверить автоматически.

## Epic DoD (Definition of Done)
Эпик считается закрытым, когда:
1) все целевые FT переведены в `Completed`,
2) по каждой completed FT есть подтверждённый evidence,
3) в epic-документе обновлён `Progress report (evidence-based)` с актуальными числами,
4) в verification matrix есть актуальная execution evidence секция по эпику.

## Feature DoD (Definition of Done)
Фича считается сделанной, когда:
1) выполнен и зафиксирован `Project grounding` (см. шаблон фичи),
2) описан контракт/операция (если нужен),
3) реализован core use-case + политики,
4) добавлены миграции/таблицы (если нужно),
5) добавлена/обновлена CLI команда (human + `--json`),
6) добавлен(ы) автотест(ы) + seed scenario (если нужен),
7) прогнаны code checks (`lint` + `typecheck` + `test`, и `build` где применимо),
8) после реализации фичи прогнаны обязательные acceptance/GS сценарии (см. verification matrix) и записаны evidence,
9) в FT-документе заполнены `Quality checks evidence` и `Acceptance evidence`,
10) для runtime/deploy/integration изменений зафиксированы CI/CD evidence (GitHub run + Vercel deployment + итоговый статус),
11) обновлены документы SSoT в `.memory-bank/spec/*` (если фича меняет правила).

Ссылки (аннотированные):
- [Engineering standards](../spec/engineering/index.md) — стандарты кодирования/архитектурных границ/тестов/документации. Читать, чтобы DoD фичи выполнялся единообразно.
- [Verification matrix](verification-matrix.md) — какие acceptance/GS считаются обязательными и где вести evidence. Читать, чтобы “done” было воспроизводимым.

## Scenarios
Каждая фича включает минимум один сценарий в формате:
- **Setup**: `seed <Sx> --json` и используемые `handles` (никаких хардкодов id) + actor roles.
- **Action**: детерминированные шаги через CLI (`--json`) и/или Client API ops.
- **Assert**: точные проверки статусов/полей/запретов (RBAC/anonymity/freeze) и typed error codes; без частичных изменений.
- **Ops**: список операций v1, которые покрывает сценарий.

## Seeds as contract for tests
- Seed scenario — часть тестового контракта: он фиксирует “стандартное состояние”.
- Тесты не хардкодят ids: они используют JSON-вывод `seed` (mapping key → id).

## Git / commits / PR traceability
Правила ветвления, commit convention (`[FT-*]`/`[EP-*]`), обязательные ссылки на FT/EP документы и обязательность evidence — SSoT в:
- [Git flow](../spec/operations/git-flow.md) — полный регламент веток, коммитов и PR + обязательные проверки и evidence. Читать перед merge, чтобы закрытие фич было трассируемым и проверяемым.
