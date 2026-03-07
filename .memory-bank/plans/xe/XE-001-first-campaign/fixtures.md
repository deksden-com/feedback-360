# XE-001 fixtures blueprint
Status: Draft (2026-03-07)

Этот документ описывает, какие fixture-файлы должны лежать рядом со сценарием и за что каждый отвечает.

## `actors.json`
Содержит:
- actor key
- email
- expected role
- employee label

Назначение:
- bootstrap users/sessions;
- читать actor roster без хардкода в phase handlers.

## `seed.json`
Содержит:
- seed handle
- expected created handles
- company/org/model/campaign shape

Назначение:
- описать ожидаемую стартовую структуру данных;
- сверять, что phase-01 действительно создал нужный baseline.

## `answers.json`
Содержит:
- per actor → per competency/indicator answers
- optional comments
- order hints if needed

Назначение:
- заполнение анкет без хардкода в phase code;
- тюнинг сценария без переписывания automation.

## `expected-results.json`
Содержит:
- group-level scores
- overall score
- effective weights
- visibility flags
- expected processed/raw visibility by role

Назначение:
- canonical expected output scenario.

## `expected-notifications.json`
Содержит:
- expected invite count
- expected recipients
- expected notification type/channel

Назначение:
- проверять notification subsystem без реальных внешних провайдеров.

## `expected-ui.json`
Содержит:
- expected labels/cards/sections per screen
- expected visible/hidden states

Назначение:
- отделить UI assertions от phase code и не смешивать их с domain fixtures.
