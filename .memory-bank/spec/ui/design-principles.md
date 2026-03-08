# UI design principles
Status: Draft (2026-03-07)

Цель: зафиксировать общие продуктовые принципы UI, чтобы дальнейший редизайн не ломал работающую функциональность, а **переставлял акценты в пользу контента и привычных SaaS-паттернов**.

Связанные документы:
- [UI sitemap & flows](sitemap-and-flows.md) — список текущих экранов и маршрутов. Читать, чтобы применять принципы к реальным surfaces, а не к абстрактным мокам.
- [Screen-by-screen redesign](screen-by-screen-redesign.md) — конкретные рекомендации по каждому экрану. Читать после этого документа, чтобы перевести принципы в изменения по маршрутам.
- [Screen specs](screens/index.md) — нормативные contracts отдельных экранов. Читать, чтобы редизайн не расходился с purpose/actions/states.
- [Design references (stitch)](design-references-stitch.md) — визуальные референсы из Stitch bundle. Читать как источник композиционных идей, но не как SSoT поведения.
- [Design system — visual baseline v2](design-system/visual-baseline-v2.md) — актуальный stylistic baseline на основе новых auth/dashboard/questionnaire references. Читать, когда нужно выравнивать весь продукт под одну visual family.

## External product references
- [Leapsome Home Dashboard](https://help.leapsome.com/hc/en-us/articles/8701421692061-Home-Dashboard) — показывает сильный dashboard-first подход: pending tasks, quick actions, overview blocks. Читать, чтобы заимствовать композицию home/landing screens без копирования доменной логики.
- [Leapsome Team Dashboard](https://help.leapsome.com/hc/en-us/articles/4402770170257-Utilizing-the-team-dashboard) — пример manager-oriented dashboard, где сверху важные контексты команды, а не просто ссылки. Читать, чтобы оформить manager surfaces как рабочие панели.
- [15Five My Team Dashboard](https://success.15five.com/hc/en-us/articles/8351656194971-Use-the-My-team-Dashboard) — пример action-first менеджерского экрана с компактной сводкой и блоками “что требует внимания”. Читать, чтобы перестроить manager home/results вокруг внимания и next actions.
- [Lattice Review Packets](https://help.lattice.com/hc/en-us/articles/360061581933-Examples-of-Review-Packets) — пример упаковки review/results в report-like surface вместо сырой таблицы. Читать, чтобы улучшать results UX и hierarchy представления.
- [Culture Amp review & sharing flow](https://support.cultureamp.com/en/articles/7048502-share-and-review-individual-effectiveness-360-survey-feedback) — пример аккуратной подачи результатов и visibility-sensitive flows. Читать, чтобы не потерять прозрачность анонимности и роль-ориентированность.

## Product-level principles
### 1. Content-first, tools-second
На каждом экране сначала показываем **рабочий объект**:
- campaign,
- questionnaire,
- result,
- employee,
- model.

Служебные действия (`retry`, `ops`, `debug`, `secondary filters`) не должны спорить с основным контентом по визуальному весу.

### 2. One primary action per screen
На каждом ключевом экране должен быть **один очевидный главный CTA**:
- создать draft,
- открыть detail,
- сохранить черновик,
- отправить анкету,
- посмотреть результаты.

Остальные действия — secondary/ghost/menu.

### 3. Familiar SaaS chrome
Внутреннее приложение должно вести себя как привычный SaaS:
- top bar / user menu,
- avatar / initials,
- name + role + active company,
- company switcher,
- sign out в user menu,
- page title + subtitle + page-level action.

### 4. CRUD pages follow common patterns
Для справочников и каталогов используем общепринятый CRUD layout:
- toolbar: search + filters + create button,
- list/table area,
- row/card summary,
- detail/edit route,
- clear empty state,
- sticky actions only where useful.

### 5. Dashboard pages answer three questions
Любой dashboard должен сразу отвечать:
1. что происходит сейчас;
2. что требует внимания;
3. что можно сделать дальше.

### 6. Progress and status are always above the fold
Для campaign/questionnaire/results screens пользователь сразу должен видеть:
- current status,
- deadline / period,
- progress,
- role / visibility note.

### 7. Role-aware simplification
Разным ролям показываем разную плотность:
- `employee` — спокойный, focused UI;
- `manager` — summary + team actions;
- `hr_admin` — richer operational surface;
- `hr_reader` — тот же контентный каркас, но без destructive/raw-only возможностей.

### 8. Explain restrictions without friction
Анонимность, read-only, freeze, hidden groups — это не “ошибки UI”, а часть продукта. Их нужно показывать:
- явно,
- дружелюбно,
- рядом с затронутым контентом,
а не прятать в недоступных state-месседжах.

## Shell principles
### Top bar
Вместо “Company ID box” в header приоритетнее:
- breadcrumbs/page context,
- current company,
- user identity,
- avatar/menu,
- optional quick actions.

`Company ID` допустим только как secondary diagnostic field.

### Sidebar
Sidebar должна:
- быть короче,
- группировать навигацию по смыслу,
- не конкурировать с основным контентом.

Suggested groups:
- Work: Home, Questionnaires, Results
- HR Admin: Employees, Org, Models, Campaigns, Notifications
- Ops: Ops

### User menu
В правом верхнем углу нужен общий user menu:
- avatar/initials,
- user display name / email,
- active role,
- active company,
- switch company,
- sign out.

## Page composition pattern
Для большинства экранов рекомендуемый шаблон:
1. `Page header`
   - title
   - subtitle
   - status badge / metadata
   - primary action
2. `Summary strip`
   - KPI cards / badges / progress / deadlines
3. `Primary content`
   - список / карточки / report blocks / form sections
4. `Secondary tools`
   - filters
   - diagnostics
   - retries
   - explainers

## Visual language
### Prefer
- clear card hierarchy,
- section headers,
- status badges,
- muted secondary metadata,
- cards with purposeful density,
- consistent spacing and typography,
- obvious empty/loading/error states.
- one coherent visual family across auth, shell, CRUD, forms and reports.

### Avoid
- одинаково тяжёлые блоки для primary и secondary информации,
- длинные полотна текста без структуры,
- “таблица ради таблицы” там, где важнее workflow,
- визуально prominent debug/ops fields.

## Results-specific principles
- summary-first, details-second;
- competency cards instead of flat metric rows where possible;
- group blocks (`Manager`, `Peers`, `Subordinates`, `Self`) как first-class sections;
- raw comments only where policy allows, и визуально отделены от processed summary;
- explanation of anonymity/merged groups рядом с affected block.

## Questionnaire-specific principles
- progress visible at all times;
- current save state visible (`draft`, `saved`, `submitted`, `read-only`);
- one competency = one stable repeatable pattern;
- comments visually attached to competency, not floating far below;
- submit action clearly separated from save draft.

## CRUD-specific principles
### List pages
- toolbar with search/filters/create,
- default sort and count visible,
- meaningful row/card summary,
- click target = whole row/card or clear “Open” CTA.

### Detail pages
- summary block at top,
- tabs/sections for sub-areas,
- metadata in side rail or muted panel,
- edit action near title, not buried at bottom.

### Create/edit pages
- form split into logical sections,
- short helper text,
- sticky footer/header actions when forms are long,
- preview or post-save return path obvious.
