# UI design references (stitch_go360go)
Status: Draft (2026-03-05)

## Purpose
Зафиксировать, какие экраны из `stitch_go360go/` используем как визуальные референсы для EP-008 и какие ограничения обязательны при их применении.

## General usage policy (mandatory)
- Макеты из `stitch_go360go/` — **только визуальный референс** (layout, иерархия, информационные блоки), а не источник бизнес-логики.
- `code.html` из архива **не копируем** в приложение: там CDN Tailwind/inline-config и демо-подходы, не соответствующие нашему production baseline.
- Реализация идёт только на зафиксированном стеке `Tailwind v4 + shadcn/ui` и через typed client API (thin UI).

## What we do NOT take from stitch (mandatory)
- Не берем не-MVP функции/кнопки: `Export PDF`, `Payroll`, любые внешние integration кнопки без покрытого API.
- Не берем доменные допущения, которые конфликтуют с SSoT (анонимность, visibility raw/processed, lock semantics, read-only после ended).
- Не берем чужие демо-данные как есть (имена/почты/метрики); только структура отображения.
- Не переносим технические артефакты демо HTML (`cdn.tailwindcss.com`, inline scripts/themes, произвольные JS snippets).

## Mapping by FT (EP-008)
### FT-0081 Auth + company switcher UI
- [`stitch_go360go/magic_link/screen.png`](../../../stitch_go360go/magic_link/screen.png): экран входа по magic link, хорошо подходит под стартовый shared flow. Читать, чтобы быстро собрать чистый login-экран без лишней навигации.
- [`stitch_go360go/_5/screen.png`](../../../stitch_go360go/_5/screen.png): выбор компании для multi-membership пользователя. Читать, чтобы правильно спроектировать company switcher после логина.
- Не берем: футерные/профильные ссылки как обязательные для MVP; оставляем только то, что нужно для login + company switch.

### FT-0082 Questionnaire UI
- [`stitch_go360go/_1/screen.png`](../../../stitch_go360go/_1/screen.png): список анкет и статусов (`не начато/в процессе/завершено`). Читать, чтобы быстро оформить “My questionnaires”.
- [`stitch_go360go/employee_feedback_questionnaire/screen.png`](../../../stitch_go360go/employee_feedback_questionnaire/screen.png): экран заполнения с прогрессом и секциями компетенций. Читать, чтобы реализовать draft/save/submit flow.
- Не берем: любые UX-решения, которые мешают read-only режиму после `ended` или скрывают доменные ошибки backend.

### FT-0083 Results UI
- [`stitch_go360go/employee_my_results_report/screen.png`](../../../stitch_go360go/employee_my_results_report/screen.png): employee dashboard с блоками score/breakdown/AI summary. Читать, чтобы задать структуру личного отчета.
- [`stitch_go360go/_3/screen.png`](../../../stitch_go360go/_3/screen.png): manager/team dashboard с прогрессом и карточками действий. Читать, чтобы оформить руководительскую витрину.
- Не берем: показ raw-текстов сотруднику/менеджеру; это запрещено правилами visibility.

### FT-0084 HR campaign UI
- [`stitch_go360go/hr_admin_campaign_dashboard/screen.png`](../../../stitch_go360go/hr_admin_campaign_dashboard/screen.png): HR dashboard кампаний (статусы, прогресс, действия). Читать, чтобы сделать основной operational экран HR.
- [`stitch_go360go/hr_admin_employee_directory/screen.png`](../../../stitch_go360go/hr_admin_employee_directory/screen.png): шаблон HR list/table паттернов (фильтры, таблица, status chips). Читать, чтобы унифицировать таблицы HR-зоны.
- Не берем: export/control элементы, для которых нет MVP API/permissions в текущем scope.

## SSoT links
- [Frontend UI stack](../engineering/frontend-ui-stack.md): зафиксированный стек и правила обновления Tailwind/shadcn. Читать, чтобы реализация референсов не ушла в другой UI стек.
- [UI sitemap & flows](sitemap-and-flows.md): обязательные MVP экраны/переходы. Читать, чтобы референсы не уводили в лишние экраны.
- [Architecture guardrails](../engineering/architecture-guardrails.md): thin UI и запрет бизнес-логики в компонентах. Читать, чтобы переносить только presentation layer.
