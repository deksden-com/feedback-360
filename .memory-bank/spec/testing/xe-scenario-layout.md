# XE scenario layout
Status: Draft (2026-03-07)

Сценарии храним отдельно от раннера. Сценарные материалы находятся в корневом каталоге `scenarios/`.

Рекомендуемая структура:

```text
scenarios/
  index.md
  XE-001-first-campaign/
    scenario.md
    scenario.json
    fixtures/
      seed.json
      actors.json
      answers.json
      expected-results.json
    phases/
      phase-01-seed.ts
      phase-02-hr-setup.ts
      phase-03-start-campaign.ts
      phase-04-fill-questionnaires.ts
      phase-05-verify-results.ts
    artifacts/
      .gitkeep
```

## Правила
- `scenario.md` — человекочитаемое описание.
- `scenario.json` — машиночитаемая спецификация run-а, фаз, policy retry и required artifacts.
- `fixtures/*` — сценарные фикстуры; это часть сценария.
- `phases/*` — phase handlers, читающие fixtures и state.
- expected outcomes храним рядом со сценарием, чтобы можно было тюнить сценарий без переписывания раннера.

## Что не дублируем
- детали экранов и их интерактивности не описываем заново в сценарии; сценарий ссылается на screen specs и POM.
- доменные правила не дублируем; сценарий ссылается на соответствующие spec документы.

## Машиночитаемость
Часть assertions допускается в JSON-форме:
- expected counts
- expected statuses
- expected result aggregates
- expected visibility flags

Если проверка слишком сложная, используем TS assertion helper в раннере.
