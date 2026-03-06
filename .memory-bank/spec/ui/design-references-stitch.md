# UI design references (stitch_go360go)
Status: Updated (2026-03-06)

## Purpose
Зафиксировать, как используем `stitch_go360go` после распаковки в `.memory-bank/assets/ui/stitch_go360go/`: какие экраны на какие GUI-эпики похожи и какие ограничения обязательны.

## Source and provenance
- [UI assets index](../../assets/ui/index.md): где лежит распакованный `stitch_go360go` и какие именно файлы считаются reference set. Читать, чтобы все ссылки в планах вели в стабильное место внутри репозитория.
- [Visual references policy](../../mbb/visual-references.md): общие правила использования mockups/screenshots. Читать, чтобы макеты не подменяли SSoT поведения.

## General usage policy (mandatory)
- Макеты из `stitch_go360go` — **только визуальный референс** (layout, иерархия, composition, card/table patterns), а не источник бизнес-логики.
- `code.html` из набора **не копируем** в приложение: там demo HTML с CDN Tailwind и inline snippets, не соответствующий нашему baseline.
- Реализация идёт только на [Frontend UI stack](../engineering/frontend-ui-stack.md): `Tailwind v4 + shadcn/ui`, плюс thin UI поверх typed client API. Читать, чтобы переносить только presentation layer.

## What we do NOT take from stitch (mandatory)
- Не берём доменные допущения, которые конфликтуют с SSoT: anonymity, raw/processed visibility, freeze semantics, read-only after ended, role visibility.
- Не берём несуществующие действия/интеграции: export, payroll, external syncs, ad-hoc admin buttons без нашего API.
- Не берём demo data как канон; имена, должности, цифры и тексты — только пример наполнения.
- Не переносим технические артефакты demo HTML (`cdn.tailwindcss.com`, inline JS/config, third-party assets без проверки).

## Existing MVP mapping (implemented)
### EP-008 — Minimal UI
- [`magic_link/screen.png`](../../assets/ui/stitch_go360go/magic_link/screen.png): auth entry point. Читать, чтобы сохранять минималистичный login without noise.
- [`_1/screen.png`](../../assets/ui/stitch_go360go/_1/screen.png): task list / questionnaires inbox. Читать, чтобы поддерживать понятную status hierarchy.
- [`employee_feedback_questionnaire/screen.png`](../../assets/ui/stitch_go360go/employee_feedback_questionnaire/screen.png): questionnaire form layout. Читать, чтобы улучшать форму без конфликтов с core rules.
- [`employee_my_results_report/screen.png`](../../assets/ui/stitch_go360go/employee_my_results_report/screen.png): results report composition. Читать, чтобы развивать employee results UI.
- [`hr_admin_campaign_dashboard/screen.png`](../../assets/ui/stitch_go360go/hr_admin_campaign_dashboard/screen.png): HR dashboard overview. Читать, чтобы эволюционировать campaign workbench.

### EP-011 — Internal app shell (implemented slice FT-0111)
- [`_1/screen.png`](../../assets/ui/stitch_go360go/_1/screen.png): card-based shell/home composition для employee.
- [`_3/screen.png`](../../assets/ui/stitch_go360go/_3/screen.png): manager-facing dashboard hierarchy.
- [`_5/screen.png`](../../assets/ui/stitch_go360go/_5/screen.png): compact summary card language для shell header/sidebar.
- Take: sidebar + compact top card composition, grouped CTAs, dashboard-like page chrome.
- Do not take: route semantics or action naming; они остаются за нашим typed client и SSoT flows.

### EP-011 — Shared states (implemented slice FT-0113)
- [`_1/screen.png`](../../assets/ui/stitch_go360go/_1/screen.png): empty-task/dashboard cards для объяснения next step.
- [`_5/screen.png`](../../assets/ui/stitch_go360go/_5/screen.png): компактные status cards и нейтральная palette для loading/empty/error wrappers.
- Take: единый card language, спокойный hierarchy, CTA внутри state cards.
- Do not take: demo copy и любые action semantics, не подтверждённые нашим flow.

## Planned GUI mapping
### EP-011 — App shell and navigation
- [`magic_link/screen.png`](../../assets/ui/stitch_go360go/magic_link/screen.png): auth entry aesthetic.
- [`_1/screen.png`](../../assets/ui/stitch_go360go/_1/screen.png): employee landing / task list structure.
- [`_3/screen.png`](../../assets/ui/stitch_go360go/_3/screen.png): manager-oriented dashboard structure.
- [`_5/screen.png`](../../assets/ui/stitch_go360go/_5/screen.png): compact summary cards and role comparisons.
- Take: shell composition, dashboard cards, CTA grouping.
- Do not take: exact labels/role wording or assumptions about available actions.

### EP-012 — HR campaigns UX
- [`hr_admin_campaign_dashboard/screen.png`](../../assets/ui/stitch_go360go/hr_admin_campaign_dashboard/screen.png): primary reference for campaigns list/detail/dashboard.
- Take: stat cards, list/detail relationship, section order.
- Do not take: export/actions not covered by our typed contract.
- Implementation note: current EP-012 uses this reference only for information hierarchy and card language; create/edit draft flow stays aligned with our draft-first lifecycle and does not inherit any unsupported export/report actions from the mock.

### EP-013 — Questionnaire experience
- [`_1/screen.png`](../../assets/ui/stitch_go360go/_1/screen.png): inbox/list pattern.
- [`employee_feedback_questionnaire/screen.png`](../../assets/ui/stitch_go360go/employee_feedback_questionnaire/screen.png): structured fill flow.
- Take: progress visibility, section grouping, action placement.
- Do not take: any behavior that overrides submit/read-only domain rules.

### EP-014 — Feature-area slice refactor
- No direct stitch mapping: эпик внутренний и не вводит новые user-facing screens.
- Take: N/A.
- Do not take: refactor не должен рождать новые UI assumptions вне уже описанных EP-011..EP-013 и последующих GUI-эпиков.

### EP-015 — Results experience
- [`employee_my_results_report/screen.png`](../../assets/ui/stitch_go360go/employee_my_results_report/screen.png): employee report hierarchy.
- [`_3/screen.png`](../../assets/ui/stitch_go360go/_3/screen.png): manager dashboard entry patterns.
- [`_5/screen.png`](../../assets/ui/stitch_go360go/_5/screen.png): summary/score card patterns.
- Take: report hierarchy, card layout, section decomposition.
- Do not take: showing raw comments to actors who must not see them.

### EP-016 — People and org admin
- [`hr_admin_employee_directory/screen.png`](../../assets/ui/stitch_go360go/hr_admin_employee_directory/screen.png): employee directory/list patterns.
- [`_2/screen.png`](../../assets/ui/stitch_go360go/_2/screen.png): org/departments editing patterns.
- Take: filters/table layout/tree affordances.
- Do not take: any assumptions about bulk ops or HR permissions not defined in RBAC.

### EP-017 — Competency models and matrix UI
- [`_4/screen.png`](../../assets/ui/stitch_go360go/_4/screen.png): competency model editor direction.
- [`hr_admin_campaign_dashboard/screen.png`](../../assets/ui/stitch_go360go/hr_admin_campaign_dashboard/screen.png): operational side panels and action groups for matrix builder.
- Take: editor section layout, side summaries, table patterns.
- Do not take: domain structure of competencies if it conflicts with our versioned model spec.

### EP-018 — Notification center UI
- Прямого stitch-экрана нет; используем общие patterns из:
  - [`hr_admin_campaign_dashboard/screen.png`](../../assets/ui/stitch_go360go/hr_admin_campaign_dashboard/screen.png)
  - [`hr_admin_employee_directory/screen.png`](../../assets/ui/stitch_go360go/hr_admin_employee_directory/screen.png)
- Take: filters, tables, status cards.
- Do not take: действия, которых нет в outbox/template subsystem.

### EP-019 — Admin and ops UI
- Прямого stitch-экрана нет; используем dashboard/status/table language из HR references и локально проектируем diagnostics surfaces.
- Take: compact operational cards and status labeling.
- Do not take: any deployment/ops semantics not confirmed in runbook and observability docs.

## Related SSoT
- [UI sitemap & flows](sitemap-and-flows.md): текущие и плановые экраны/переходы. Читать, чтобы visual refs не уводили в несуществующие routes и actor journeys.
- [Architecture guardrails](../engineering/architecture-guardrails.md): запрет доменной логики в компонентах. Читать, чтобы переносить только UI layer.
