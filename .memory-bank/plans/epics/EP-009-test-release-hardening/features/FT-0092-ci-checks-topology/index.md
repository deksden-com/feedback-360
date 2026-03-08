---
description: FT-0092-ci-checks-topology feature plan and evidence entry for EP-009-test-release-hardening.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-009-test-release-hardening/index.md
epic: EP-009
feature: FT-0092
---


# FT-0092 — CI checks topology
Status: Completed (2026-03-05)

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

## Quality checks evidence (2026-03-05)
- Checks run:
  - `pnpm -r lint`
  - `pnpm checks`
- Result:
  - passed; локально воспроизводится тот же lane, который запускает GitHub Actions job `checks`.

## Acceptance evidence (2026-03-05)
- Commands/tests run:
  - `gh pr checks 26`
  - `gh run list --workflow ci.yml --limit 3`
- Result:
  - passed; PR `#26` показывает required context `checks` и оба актуальных run-а завершены `success`;
  - push run: `https://github.com/deksden-com/feedback-360/actions/runs/22738343183`
  - PR run: `https://github.com/deksden-com/feedback-360/actions/runs/22738344260`

## CI/CD evidence
- GitHub:
  - Push run: `https://github.com/deksden-com/feedback-360/actions/runs/22738343183`
  - PR run: `https://github.com/deksden-com/feedback-360/actions/runs/22738344260`
  - Status: `success`
- Vercel:
  - `https://go360go-beta-qjzyzd712-deksdens-projects.vercel.app` — `Ready`
  - `https://vercel.com/deksdens-projects/go360go-prod/7XxudVMEifns5DnUMckfEMfvwNCz` — `Ready`
- Root cause before fix:
  - initial PR lane падал не по логике, а на format/lint drift в `apps/web`;
  - после фикса форматирования `checks` стабильно совпадает с branch protection context.
