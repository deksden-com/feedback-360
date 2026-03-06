# UI Assets Index
Status: Draft (2026-03-06)

Цель: хранить и индексировать визуальные референсы для `apps/web` так, чтобы было понятно:
- откуда взялся asset,
- для какого GUI-эпика он полезен,
- что из него можно брать, а что нельзя.

## Provenance
- Исходный архив: `stitch_go360go.zip` в корне репозитория. Это внешняя выгрузка из AI UI generation сервиса; она не является SSoT и не должна использоваться как источник доменной логики.
- Распакованный набор: [`stitch_go360go/`](stitch_go360go/) — локальная копия референсов внутри меморибанка. Читать, чтобы работать со стабильными путями в документации и не зависеть от временного архива.

## Usage rules
- [Visual references policy](../../mbb/visual-references.md): как хранить, индексировать и применять визуальные референсы. Читать перед добавлением новых моков, чтобы они не подменяли требования.
- [Stitch design mapping](../../spec/ui/design-references-stitch.md): соответствие экранов `stitch_go360go` нашим GUI-эпикам и ограничения на использование. Читать перед планированием или реализацией UI-фич, чтобы брать только релевантные layout-паттерны.

## Catalog
- [`stitch_go360go/magic_link/screen.png`](stitch_go360go/magic_link/screen.png): референс входа по magic link. Читать для EP-011, чтобы собрать аккуратный auth-shell без лишней навигации.
- [`stitch_go360go/hr_admin_campaign_dashboard/screen.png`](stitch_go360go/hr_admin_campaign_dashboard/screen.png): референс HR dashboard кампаний. Читать для EP-012, чтобы задать карточки статусов, CTA и компоновку overview.
- [`stitch_go360go/employee_feedback_questionnaire/screen.png`](stitch_go360go/employee_feedback_questionnaire/screen.png): референс формы оценки. Читать для EP-013, чтобы спроектировать flow заполнения анкеты с прогрессом и секциями.
- [`stitch_go360go/employee_my_results_report/screen.png`](stitch_go360go/employee_my_results_report/screen.png): референс личного отчёта сотрудника. Читать для EP-014, чтобы оформить summary, групповые блоки и AI summary без нарушения visibility rules.
- [`stitch_go360go/hr_admin_employee_directory/screen.png`](stitch_go360go/hr_admin_employee_directory/screen.png): референс справочника сотрудников. Читать для EP-015, чтобы унифицировать table/filter patterns в HR-зоне.
- [`stitch_go360go/_1/screen.png`](stitch_go360go/_1/screen.png): референс dashboard/task list “анкеты для заполнения”. Читать для EP-011 и EP-013, чтобы оформить employee landing и inbox анкет.
- [`stitch_go360go/_2/screen.png`](stitch_go360go/_2/screen.png): референс departments/org management. Читать для EP-015, чтобы наметить layout дерева подразделений и admin actions.
- [`stitch_go360go/_3/screen.png`](stitch_go360go/_3/screen.png): референс manager-oriented dashboard. Читать для EP-011 и EP-014, чтобы оформить manager home и team results entry points.
- [`stitch_go360go/_4/screen.png`](stitch_go360go/_4/screen.png): референс competency/model editor. Читать для EP-016, чтобы оформить HR интерфейс моделей компетенций.
- [`stitch_go360go/_5/screen.png`](stitch_go360go/_5/screen.png): референс compact role comparison cards. Читать для EP-011 и EP-014, чтобы подсмотреть layout summary cards и quick comparisons.

## Source HTML (read-only)
- [`stitch_go360go/magic_link/code.html`](stitch_go360go/magic_link/code.html): HTML-слепок auth screen. Читать только как reference на layout/spacing; код не копируем в приложение.
- [`stitch_go360go/hr_admin_campaign_dashboard/code.html`](stitch_go360go/hr_admin_campaign_dashboard/code.html): HTML-слепок HR dashboard. Читать для семантики layout, но не переносить inline scripts и CDN-зависимости.
- [`stitch_go360go/employee_feedback_questionnaire/code.html`](stitch_go360go/employee_feedback_questionnaire/code.html): HTML-слепок анкеты. Читать, чтобы оценить структуру секций и affordances перед реализацией формы.
