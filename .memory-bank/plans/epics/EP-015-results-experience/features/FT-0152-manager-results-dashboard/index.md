# FT-0152 — Manager team results dashboard
Status: Completed (2026-03-06)

## User value
Руководитель видит результаты подчинённых в разрешённом объёме и не нарушает анонимность других групп.

## Deliverables
- Team results dashboard with subject switcher.
- Hidden/merged group indicators.
- Manager-safe summary and drill-down.

## Context (SSoT links)
- [Results visibility](../../../../../spec/domain/results-visibility.md): manager scope and restrictions. Читать, чтобы UI показывал только допустимое.
- [Anonymity policy](../../../../../spec/domain/anonymity-policy.md): threshold and merge/hide rules. Читать, чтобы правильно маркировать hidden groups.
- [Stitch mapping — EP-015](../../../../../spec/ui/design-references-stitch.md#ep-015--results-experience): manager-oriented reference patterns.

## Project grounding
- Проверить current `/results/team` and its role checks.
- Свериться with small-group variants in seeds and GS2.

## Implementation plan
- Добавить subject switcher and structured group sections.
- Явно объяснять unavailable groups.
- Сохранять strict manager scoping.

## Scenarios (auto acceptance)
### Setup
- Seed: `S9_campaign_completed_with_ai`, plus small-group variants.

### Action
1. Manager opens team results.
2. Switches between subjects.

### Assert
- Small groups hidden/merged as configured.
- Manager block visible where allowed.
- Raw text absent.

### Client API ops (v1)
- `results.getTeamDashboard`.

## Manual verification (deployed environment)
- `beta`: открыть team results разных подчинённых и проверить explanations on hidden groups.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)

## Progress note (2026-03-06)
- Выполнен вертикальный слайс FT-0152:
  - `/results/team` получил manager-oriented toolbar с campaign/subject switching;
  - UI явно объясняет `merged`/`hidden` группы и не показывает raw comments;
  - domain permissions остаются enforced в `results.getTeamDashboard`, UI не расширяет manager scope.

## Quality checks evidence (2026-03-06)
- `pnpm --filter @feedback-360/web lint` → passed.
- `pnpm --filter @feedback-360/web typecheck` → passed.
- `pnpm --filter @feedback-360/web test` → passed.
- `pnpm --filter @feedback-360/web build` → passed.

## Acceptance evidence (2026-03-06)
- Local acceptance:
  - `cd apps/web && PLAYWRIGHT_BASE_URL=http://127.0.0.1:3101 node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0083-results-ui.spec.ts tests/ft-0152-manager-results-dashboard.spec.ts --workers=1 --reporter=line` → passed.
- Beta acceptance:
  - `cd apps/web && PLAYWRIGHT_BASE_URL=https://beta.go360go.ru node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0083-results-ui.spec.ts tests/ft-0152-manager-results-dashboard.spec.ts --workers=1 --reporter=line` → passed after merge commit `82eb507975ceda162f29e53c42cfd0ba8fb2bcaf`.
- Covered acceptance:
  - manager может открыть results для подчинённого и переключать subject внутри campaign context;
  - `peers/subordinates` при `merge_to_other` отображаются как merged, а `other` раскрывается безопасно;
  - raw text отсутствует.
- Artifacts:
  - manager team results dashboard.
    ![ft-0152-manager-team-results-dashboard](../../../../../evidence/EP-015/FT-0152/2026-03-06/step-01-manager-team-results-dashboard.png)

## Manual verification (deployed environment)
### Beta scenario — manager team results
- Environment:
  - URL: `https://beta.go360go.ru`
  - account: manager with completed campaign (`deksden@deksden.com` через CLI-prepared seed)
- Steps:
  1. Войти по magic link и выбрать активную компанию.
  2. Открыть `/results/team?campaignId=<completed_campaign_id>&subjectEmployeeId=<subject_id>`.
  3. Проверить toolbar, subject switcher и group cards.
  4. Убедиться, что `Raw:` отсутствует и hidden/merged group explanations присутствуют.
- Expected:
  - manager видит только разрешённый subject;
  - merged/hidden states объяснены явно;
  - open-text ограничен processed/summary данными.
- Result:
  - passed on `https://beta.go360go.ru`.
