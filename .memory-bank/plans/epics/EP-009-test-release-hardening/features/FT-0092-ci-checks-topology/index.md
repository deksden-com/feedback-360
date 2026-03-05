# FT-0092 — CI checks topology
Status: Draft (2026-03-05)

## User value
PR в `develop` проходят через понятный и стабильный merge gate: видно, какие проверки обязательны, что именно упало и как это воспроизвести локально.

## Deliverables
- GitHub Actions workflow(s) с явным required `checks` статусом.
- Разделение шагов `lint`, `typecheck`, `unit/contract`, `db integration`, `build`.
- Понятный fail surface: если падает шаг, видно почему и в каком lane.
- Документированная связь branch protection ↔ workflow name ↔ required status.

## Context (SSoT links)
- [Git flow](../../../../../spec/operations/git-flow.md): правила веток, PR и обязательных проверок. Читать, чтобы workflow topology соответствовала agreed merge process.
- [Delivery standards](../../../../../spec/engineering/delivery-standards.md): quality/acceptance/deploy gates. Читать, чтобы `checks` отражал реальную готовность.
- [Deployment architecture](../../../../../spec/operations/deployment-architecture.md): beta/prod деплой и их место в release path. Читать, чтобы CI и deploy checks были согласованы.

## Acceptance (auto)
### Setup
- Открыт PR в `develop` с изменениями в коде.

### Action
1) Запускается GitHub Actions `checks`.
2) PR показывает required status `checks`.
3) После зелёного `checks` и Vercel deploy PR становится mergeable.

### Assert
- Нет ситуации, где branch protection ждёт несуществующий или “не тот” check.
- `checks` покрывает весь agreed quality gate.
- Merge gate воспроизводим локально теми же командами.

## Implementation plan (target repo)
- Нормализовать workflow names/job names и branch protection mapping.
- Убедиться, что один required context соответствует реальному workflow/job.
- Вынести долгие/нестабильные шаги в явные под-lanes, но не терять единый required gate.
- Зафиксировать commands и troubleshooting в docs.

## Tests
- CI validation: PR check run появляется и завершается expected context name.
- Smoke: тестовый PR в `develop` становится mergeable после зелёных checks.

## Memory bank updates
- Обновить [Git flow](../../../../../spec/operations/git-flow.md), [Delivery standards](../../../../../spec/engineering/delivery-standards.md), [Runbook](../../../../../spec/operations/runbook.md).

## Verification (must)
- Automated check: реальный PR в GitHub показывает required `checks`.
- Must run: PR smoke against `develop`.

## Manual verification (deployed environment)
- Environment:
  - GitHub repository PR against `develop`
  - Date: `2026-03-05`
- Steps:
  1. Открыть тестовый PR.
  2. Дождаться GitHub Actions и Vercel checks.
  3. Проверить mergeability.
- Expected:
  - `checks` присутствует как required status;
  - PR не блокируется “ожидаемым, но отсутствующим” контекстом;
  - после completion merge разрешён.
