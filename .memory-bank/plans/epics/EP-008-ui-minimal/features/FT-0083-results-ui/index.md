# FT-0083 — Results UI (employee/manager/hr)
Status: Draft (2026-03-03)

## User value
Пользователь видит результаты в своём кабинете; менеджер и HR видят свои витрины.

## Deliverables
- Employee dashboard (calls `results.getMyDashboard`).
- Manager/team view (calls `results.getTeamDashboard`).
- HR results view (calls `results.getHrView`).

## Context (SSoT links)
- [Results visibility](../../../../../spec/domain/results-visibility.md): кто видит raw vs processed. Читать, чтобы UI не пытался показывать “что-то лишнее”.
- [Anonymity policy](../../../../../spec/domain/anonymity-policy.md): hide/merge и edge cases. Читать, чтобы UI показывал “скрыто/объединено” корректно.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): как UI использует typed client и как тестируем. Читать, чтобы UI не содержал доменных правил.
- [Stitch design refs for FT-0083](../../../../../spec/ui/design-references-stitch.md#ft-0083-results-ui): визуальные референсы employee/team dashboard с оговоренными ограничениями. Читать, чтобы сохранить UX и не нарушить privacy rules.

## Acceptance (auto, Playwright)
### Setup
- Seed: `S9_campaign_completed_with_ai`

### Action
1) Под employee открыть results dashboard.
2) Под hr_reader открыть HR results view.

### Assert
- Employee не видит raw open text.
- HR reader (MVP) видит raw + processed/summary.

## Implementation plan (target repo)
- Screens:
  - Employee dashboard: `results.getMyDashboard` + визуализация gaps и агрегатов.
  - Manager view: `results.getTeamDashboard` + выбор subject (если нужно).
  - HR view: `results.getHrView` + raw/processed (MVP).
- Тонкие моменты:
  - UI не должен “декодировать” анонимность — он отображает `visibility` флаги из API.
  - Open text: если processed нет — показываем “обработка не завершена”, не raw.

## Tests
- Playwright: под employee открыть dashboard и проверить отсутствие raw полей (через UI assertion или network intercept).
- Playwright: под hr_reader открыть HR view и проверить наличие raw+processed.

## Memory bank updates
- Если меняется набор экранов/переходов — обновить: [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md) — SSoT. Читать, чтобы UI соответствовал плану.

## Verification (must)
- Automated test: Playwright assertions по results screens (employee без raw, HR reader с raw).
- Must run: Playwright e2e на seed `S9_campaign_completed_with_ai`.

## Design references (stitch)
- [`stitch_go360go/employee_my_results_report/screen.png`](../../../../../../stitch_go360go/employee_my_results_report/screen.png): employee results dashboard (score, breakdown, AI summary). Используем для структуры личного отчета.
- [`stitch_go360go/_3/screen.png`](../../../../../../stitch_go360go/_3/screen.png): manager/team dashboard с прогрессом и pending actions. Используем как референс руководительского экрана.

## Design constraints (what we do NOT take)
- Не показываем `rawText` на employee/manager экранах даже если референс визуально подразумевает детальные цитаты.
- Не переносим экспорт/report actions, если операция не покрыта контрактом MVP.
