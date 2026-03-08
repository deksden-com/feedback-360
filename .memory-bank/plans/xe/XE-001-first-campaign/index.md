---
description: XE-001-first-campaign cross-epic scenario specification and execution guide.
purpose: Read to understand the scenario phases, fixtures, expectations, and manual/beta walkthroughs.
status: Draft
date: 2026-03-09
parent: .memory-bank/plans/xe/index.md
scenario: XE-001
---


# XE-001 — First 360 campaign happy path
Status: Draft (2026-03-07)

Цель: проверить основной сквозной пользовательский путь системы от HR-настройки до просмотра результатов разными ролями.

## Scope and SSoT links
- [Calculations](../../../spec/domain/calculations.md): как считаются indicators и веса групп. Читать, чтобы expected results для сценария совпадали с доменной моделью.
- [Anonymity policy](../../../spec/domain/anonymity-policy.md): threshold=3 и правила видимости групп. Читать, чтобы fixture состава оценщиков не нарушал privacy assumptions.
- [Results visibility](../../../spec/domain/results-visibility.md): что видят employee/manager/hr_admin/hr_reader. Читать, чтобы финальные UI assertions проверяли правильные surfaces.
- [UI automation contract](../../../spec/testing/ui-automation-contract.md): browser strategy и POM contract для GUI-фаз. Читать, чтобы XE-001 реализовывался через стабильный automation layer.

## Scenario goal
Сценарий должен доказать, что система умеет:
- создать и стартовать кампанию 360;
- выпустить приглашения/notification intents;
- дать нескольким actor’ам обычные authenticated sessions;
- принять ответы по анкете в фиксированном наборе;
- посчитать результаты по indicators + group weights;
- показать корректные dashboards для employee, manager и HR;
- не утекать raw text в employee/manager views.

## Actors
- `hr_admin`
- `manager`
- `subject`
- `peer_1`
- `peer_2`
- `peer_3`
- `subordinate_1`
- `subordinate_2`
- `subordinate_3`

## Scenario seed
- использует `system seed`
- далее применяет именованный seed `XE-001-first-campaign`

Seed создаёт:
- 1 компанию `xe001-company`
- 1 HR admin user/employee/membership
- оргструктуру с `subject`, `manager`, 3 peers и 3 subordinates
- 1 indicators model с 2 competency groups и 4 competencies
- 1 campaign draft с default weights:
  - manager 40
  - peers 30
  - subordinates 30
  - self 0
- participant set и assignments для одного subject

## Fixtures рядом со сценарием
- `actors.json` — emails, actor keys, role hints
- `seed.json` — что создаёт seed и какие handles ожидаются
- `answers.json` — как именно каждый actor отвечает
- `expected-results.json` — expected group and overall aggregates
- `expected-notifications.json` — expected invite intents
- `expected-ui.json` — expected visible labels/cards/messages on final dashboards

## Canonical bindings
После `phase-01-seed` и далее runner обязан иметь явные bindings:
- `company.id`
- `campaign.id`
- `modelVersion.id`
- `actors.<actor>.userId`
- `actors.<actor>.employeeId`
- `questionnaires.<actor>_to_subject`
- `sessions.<actor>.storageStatePath` (после bootstrap phase)

Cleanup опирается только на эти traces/bindings.

## Planned phases

### `phase-01-seed`
Назначение:
- создать run workspace;
- применить seed;
- сохранить bindings и initial DB slices.

Actions:
- `xe runs create`
- `xe seeds apply XE-001-first-campaign --run <run-id>`
- capture seed handles/bindings

Assertions:
- company/model/campaign/actors/assignments созданы;
- campaign status = `draft`;
- questionnaires exist for all required actor→subject pairs.

Required artifacts:
- `bindings.json`
- `assertions.json`
- `seed-summary.json`
- `db-slice-company.json`

### `phase-02-hr-setup`
Назначение:
- HR проверяет, что оргструктура, модель и draft campaign выглядят корректно.

Actions:
- bootstrap session for `hr_admin`
- open HR campaign page / campaign detail
- open HR people/org surfaces if needed

Assertions:
- campaign detail доступен HR;
- subject и assignments видимы;
- model/version and schedule are present;
- campaign still mutable (`draft`).

Required artifacts:
- `assertions.json`
- `screenshots/hr-campaign-draft.png`

### `phase-03-start-campaign`
Назначение:
- стартовать кампанию и проверить notification intents.

Actions:
- HR starts campaign
- controlled notification generation/dispatch through test adapter

Assertions:
- campaign status = `started`
- notification intents count matches expected actors
- every invite notification references the same campaign/run

Required artifacts:
- `assertions.json`
- `campaign.json`
- `notifications.json`
- `screenshots/hr-campaign-started.png`

### `phase-04-access-bootstrap`
Назначение:
- создать authenticated sessions для всех actor’ов без GUI login flow.

Actions:
- `xe auth issue <run-id> --actor <actor> --format storage-state`
- save actor storage states into workspace

Assertions:
- every actor has a valid storage state file
- actor can open internal app shell and see expected company context

Required artifacts:
- `assertions.json`
- `sessions.json`

### `phase-05-fill-questionnaires`
Назначение:
- заполнить анкеты по детерминированным fixture answers.

Actions:
- actors open questionnaire inbox / questionnaire fill page
- apply `answers.json`
- submit all questionnaires

Assertions:
- first draft save sets campaign lock
- all expected questionnaires become `submitted`
- no extra questionnaires remain `not_started`

Required artifacts:
- `assertions.json`
- `questionnaires.json`
- `db-slice-questionnaires.json`
- `screenshots/questionnaire-fill.png`

### `phase-06-complete-processing`
Назначение:
- завершить кампанию и выполнить controlled post-processing.

Actions:
- end campaign through deterministic helper
- run AI stub / controlled completion path

Assertions:
- campaign status = `completed`
- processed/summary text exists where expected
- no unresolved ai job remains for this campaign

Required artifacts:
- `assertions.json`
- `campaign-final.json`
- `db-slice-processing.json`

### `phase-07-verify-results`
Назначение:
- проверить итоговые dashboards и aggregates для employee / manager / HR.

Actions:
- open employee results dashboard as `subject`
- open team results as `manager`
- open HR results workbench as `hr_admin`

Assertions:
- employee sees aggregates + processed/summary text, but no raw
- manager sees team-safe results, but no raw
- hr_admin sees raw + processed + summary
- group scores and overall score match `expected-results.json`
- peers and subordinates are shown (threshold=3 satisfied)

Required artifacts:
- `assertions.json`
- `results-snapshot.json`
- `screenshots/results-employee.png`
- `screenshots/results-manager.png`
- `screenshots/results-hr.png`

## Suggested fixture model

### Competencies
Модель для первого сценария должна быть маленькой, но не тривиальной:
- Group A: `Communication`
  - `Clarity`
  - `Feedback`
- Group B: `Execution`
  - `Ownership`
  - `Planning`

У каждой competency по 2 indicators.

### Answers
Для простоты first version uses indicators only.

Recommended pattern:
- `self`: slightly inflated (mostly `5`)
- `manager`: strong, but realistic (`4`)
- `peers`: mostly `3`/`4`
- `subordinates`: mostly `4`

Этого достаточно, чтобы:
- получить неравные group scores;
- проверить weighted overall;
- увидеть различия между self и others.

## Expected result shape
`expected-results.json` должен минимум содержать:
- per-group competency scores
- per-group overall scores
- effective group weights
- final overall score
- visibility flags for:
  - `manager`
  - `peers`
  - `subordinates`
  - `self`
- raw/processed visibility expectations by actor role

## Required UI / POM coverage
Для `XE-001` обязательны:
- screen specs:
  - `internal-home`
  - `questionnaire-inbox`
  - `questionnaire-fill`
  - `employee-results-dashboard`
  - дополнительные screen specs для HR campaign detail / manager results / HR results должны быть добавлены до реализации scenario
- POM objects for the same screens and role-specific result views.

## Required evidence
- `run.json`
- `state.json`
- `phase-*/assertions.json`
- `bindings.json`
- `phase-05/db-slice-questionnaires.json`
- `phase-07/results-snapshot.json`
- минимум 5 screenshots:
  - HR campaign started
  - questionnaire fill
  - employee results
  - manager results
  - HR results

## MVP execution policy
- concurrent runs: disabled
- phase retry policy: default `fail_run`
- cleanup: explicit via `xe runs delete <run-id>`

## Implementation prerequisites
До кодирования `XE-001` должны быть готовы:
- `FT-0201` run registry + lock + cleanup
- `FT-0202` named seed support
- `FT-0203` notification test adapter + auth bootstrap
- `FT-0204` basic XE CLI
- `FT-0205` phase runner + state/bindings/artifacts
- `FT-0206` screen specs + POM contract for covered surfaces
