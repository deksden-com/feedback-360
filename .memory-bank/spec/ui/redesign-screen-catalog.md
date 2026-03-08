# UI redesign handoff — single-file screens, transitions, information architecture
Status: Draft (2026-03-08)

Цель документа: дать специализированному инструменту/дизайнеру **один самодостаточный входной документ** по текущему продукту:
- какие экраны существуют;
- как пользователь между ними перемещается;
- какая информация и какие действия есть на каждом экране;
- какие доменные ограничения **нельзя потерять** при редизайне.

Это **single-file handoff**: для первичного редизайна достаточно этого файла. Связанные документы остаются полезными, но не обязательны:
- [Sitemap & flows](sitemap-and-flows.md) — текущая карта маршрутов и actor flows. Читать, если нужен дополнительный контроль полного route map.
- [Screen registry](screen-registry.md) — канонические `screen_id`, routes и `testIdScope`. Читать, если нужно синхронизировать названия с кодом/автоматизацией.
- [UI design principles](design-principles.md) — content-first и familiar SaaS правила. Читать, если нужен отдельный набор дизайн-принципов.
- [Design system](design-system/index.md) — токены, статусы и компонентные паттерны. Читать, если редизайн будет сразу переводиться в системные tokens/components.

## Product context in one page
- Продукт: внутренняя система HR-оценки сотрудников методом **360 градусов**.
- Основные акторы: `HR Admin`, `HR Reader`, `Manager`, `Employee`.
- Ключевая ценность UI: помогать ролям выполнять рабочий процесс оценки, а не показывать служебные элементы ради самих элементов.
- Желаемый визуальный стиль: современный B2B SaaS, content-first, спокойный профессиональный интерфейс, сильная визуальная иерархия, привычные CRUD/dashboards/shell patterns.
- Что нельзя сломать редизайном:
  - роли и ограничения видимости;
  - анонимность;
  - freeze и read-only правила;
  - state machine кампании;
  - различие между `indicators` и `levels`;
  - различие между `HR Admin` и `HR Reader`.

## Actors and role differences

### `HR Admin`
- Полный HR-operational доступ.
- Управляет справочником сотрудников, оргструктурой, моделями, кампаниями, матрицей, уведомлениями.
- Видит HR results workbench.
- Видит оригинальные комментарии в результатах.

### `HR Reader`
- Широкий read-only доступ в HR-контуре.
- Может просматривать справочники, кампании, результаты и operational surfaces.
- Не выполняет destructive / mutating actions.
- Не видит raw comments.

### `Manager`
- Заполняет свои анкеты.
- Видит командные результаты по доступным подчинённым.
- Не видит raw comments.

### `Employee`
- Заполняет назначенные анкеты.
- Видит собственные результаты и self-vs-others differences.
- Не видит raw comments и скрытые малые группы.

## Global UI structure

### App shell
На всех внутренних экранах нужен привычный SaaS shell:
- глобальная навигация;
- company context;
- текущий пользователь;
- avatar/initials;
- account menu;
- logout;
- заметная page title area;
- page-level primary CTA там, где уместно.

### Page anatomy
Для большинства экранов целевой паттерн такой:
1. page header;
2. summary / hero / KPI strip;
3. primary working content;
4. secondary tools / filters / diagnostics.

### Common state variants
У каждого значимого экрана должны быть визуально продуманы:
- loading;
- empty;
- validation error;
- permission-denied / role-mismatch;
- read-only / locked;
- completed/submitted/success.

## Global domain rules that affect UI

### Company and identity
- Один `user` может состоять в нескольких компаниях.
- После логина пользователь выбирает активную компанию.
- Активная компания влияет на все маршруты и данные в shell.

### Campaign lifecycle
- Кампания проходит статусы:
  - `draft`
  - `started`
  - `ended`
  - `processing_ai`
  - `ai_failed`
  - `completed`
- UI должен явно показывать текущий статус кампании и доступные действия.

### Freeze and lock rules
- Пока кампания в `draft`, можно редактировать её структуру.
- После `started` нельзя менять модель компетенций и состав участников.
- Первый `draft save` в любой анкете ставит campaign-level lock:
  - нельзя менять матрицу оценивающих;
  - нельзя менять веса.
- После `ended` анкеты становятся read-only.

### Anonymity and visibility
- Для `peers` и `subordinates` действует threshold `3`.
- Оценка руководителя всегда показывается не анонимно.
- Self visible, но имеет вес `0%`.
- Employee и manager не видят raw comments.
- `HR Admin` видит original + processed comments.
- `HR Reader` не видит raw comments.

### Models: indicators vs levels
- `Indicators`:
  - шкала `1..5` + `NA`;
  - UI может показывать агрегированный score.
- `Levels`:
  - уровни `1..4` + `unsure`;
  - UI **не должен** делать главным сигналом “средний уровень”;
  - основной сигнал — `distribution` + `mode`.

### Results and comments
- Открытые комментарии для employee и manager показываются только в безопасном/обработанном виде.
- Raw/original comments — только для `HR Admin`.

## Visual direction for redesign
- Стиль: modern B2B SaaS, calm and credible.
- Приоритет: контент и следующий шаг пользователя.
- Dashboard screens должны быть action-oriented.
- CRUD screens должны быть похожи на привычные SaaS patterns:
  - title + summary
  - toolbar / filters
  - list or table
  - detail surface
- Results screens должны быть похожи на “report/workbench”, а не на технический dump.
- Operational/debug sections вторичны и не должны спорить с основным контентом.

## Canonical screen list
- `SCR-AUTH-LOGIN`
- `SCR-AUTH-CALLBACK`
- `SCR-COMPANY-SWITCHER`
- `SCR-APP-HOME`
- `SCR-HR-EMPLOYEES`
- `SCR-HR-EMPLOYEE-CREATE`
- `SCR-HR-EMPLOYEE-DETAIL`
- `SCR-HR-ORG`
- `SCR-HR-MODELS`
- `SCR-HR-MODEL-CREATE`
- `SCR-HR-MODEL-DETAIL`
- `SCR-HR-CAMPAIGNS`
- `SCR-HR-CAMPAIGN-CREATE`
- `SCR-HR-CAMPAIGN-DETAIL`
- `SCR-HR-CAMPAIGN-EDIT`
- `SCR-HR-CAMPAIGN-MATRIX`
- `SCR-HR-NOTIFICATIONS`
- `SCR-QUESTIONNAIRES-INBOX`
- `SCR-QUESTIONNAIRES-FILL`
- `SCR-RESULTS-EMPLOYEE`
- `SCR-RESULTS-MANAGER`
- `SCR-RESULTS-HR`
- `SCR-OPS`

## Handoff rules for redesign
- Редизайн **не меняет** доменную логику, права, статусы, анонимность, freeze-правила и расчёты.
- Редизайн может менять layout, visual hierarchy, density, navigation chrome и component composition.
- Приоритет: показывать **рабочий контент** и **следующее действие**, а не служебные controls.
- В любых макетах должны сохраняться:
  - `screen_id`;
  - роль пользователя;
  - state-specific behavior;
  - visibility/privacy constraints.

## Global navigation model

### Guest flow
1. `SCR-AUTH-LOGIN` → пользователь вводит email или XE/dev token.
2. `SCR-AUTH-CALLBACK` → система завершает вход.
3. `SCR-COMPANY-SWITCHER` → если у пользователя несколько memberships.
4. `SCR-APP-HOME` → role-aware landing page.

### HR flow
1. `SCR-APP-HOME`
2. `SCR-HR-EMPLOYEES` / `SCR-HR-EMPLOYEE-CREATE` / `SCR-HR-EMPLOYEE-DETAIL`
3. `SCR-HR-ORG`
4. `SCR-HR-MODELS` / `SCR-HR-MODEL-CREATE` / `SCR-HR-MODEL-DETAIL`
5. `SCR-HR-CAMPAIGNS` / `SCR-HR-CAMPAIGN-CREATE` / `SCR-HR-CAMPAIGN-DETAIL` / `SCR-HR-CAMPAIGN-EDIT` / `SCR-HR-CAMPAIGN-MATRIX`
6. `SCR-HR-NOTIFICATIONS`
7. `SCR-RESULTS-HR`
8. `SCR-OPS`

### Employee flow
1. `SCR-APP-HOME`
2. `SCR-QUESTIONNAIRES-INBOX`
3. `SCR-QUESTIONNAIRES-FILL`
4. `SCR-RESULTS-EMPLOYEE`

### Manager flow
1. `SCR-APP-HOME`
2. `SCR-QUESTIONNAIRES-INBOX`
3. `SCR-QUESTIONNAIRES-FILL`
4. `SCR-RESULTS-MANAGER`
5. optionally own `SCR-RESULTS-EMPLOYEE`

## Transition map

| From | Action | To | Notes |
|---|---|---|---|
| `SCR-AUTH-LOGIN` | submit email/token | `SCR-AUTH-CALLBACK` or authenticated session | XE/dev token login only in local/beta |
| `SCR-AUTH-CALLBACK` | auth success | `SCR-COMPANY-SWITCHER` or `SCR-APP-HOME` | depends on memberships count |
| `SCR-COMPANY-SWITCHER` | choose company | `SCR-APP-HOME` | active company becomes current context |
| `SCR-APP-HOME` | choose work area | role-specific screen | nav depends on role |
| `SCR-HR-EMPLOYEES` | create employee | `SCR-HR-EMPLOYEE-CREATE` | HR admin only |
| `SCR-HR-EMPLOYEES` | open employee | `SCR-HR-EMPLOYEE-DETAIL` | HR admin / HR reader |
| `SCR-HR-ORG` | pick department / employee | stays on screen | selected-node workflow |
| `SCR-HR-MODELS` | create model | `SCR-HR-MODEL-CREATE` | draft-first |
| `SCR-HR-MODELS` | open model version | `SCR-HR-MODEL-DETAIL` | published = read-only |
| `SCR-HR-CAMPAIGNS` | create campaign | `SCR-HR-CAMPAIGN-CREATE` | draft-first |
| `SCR-HR-CAMPAIGNS` | open campaign | `SCR-HR-CAMPAIGN-DETAIL` | status-aware detail |
| `SCR-HR-CAMPAIGN-DETAIL` | edit draft | `SCR-HR-CAMPAIGN-EDIT` | draft only |
| `SCR-HR-CAMPAIGN-DETAIL` | open matrix | `SCR-HR-CAMPAIGN-MATRIX` | before/after lock differs |
| `SCR-QUESTIONNAIRES-INBOX` | open questionnaire | `SCR-QUESTIONNAIRES-FILL` | draft/submitted/open states |
| `SCR-QUESTIONNAIRES-FILL` | submit | stays on screen in read-only or returns to inbox | depends on UX choice |
| `SCR-RESULTS-MANAGER` | switch subject | stays on screen | selected subject changes content |
| `SCR-RESULTS-HR` | switch campaign/subject | stays on screen | filter-driven workbench |

## Screen catalog

Ниже каждый экран описан одинаковым шаблоном:
- `Purpose`
- `Primary information`
- `Primary actions`
- `Secondary actions / utilities`
- `Domain constraints`
- `Entry / exit transitions`

## `SCR-AUTH-LOGIN` — Login
- **Route:** `/auth/login`
- **Actors:** guest
- **Purpose:** вход в систему по magic link email или XE/dev token helper.
- **Primary information:**
  - branding / short explanation what the system is;
  - login form by email;
  - optional XE/dev helper block in allowed environments.
- **Primary actions:** request magic link; login by XE token.
- **Secondary actions / utilities:** helper text about invited users only; environment-specific debug/dev section.
- **Domain constraints:** публичный signup выключен; логин доступен только сотрудникам из HR-справочника; XE/dev token flow разрешён только в `local`/`beta`.
- **Entry / exit transitions:** entry from logged-out state; exit to `SCR-AUTH-CALLBACK` or authenticated session.

## `SCR-AUTH-CALLBACK` — Auth callback
- **Route:** `/auth/callback`
- **Actors:** guest
- **Purpose:** завершить magic-link login и создать обычную пользовательскую сессию.
- **Primary information:** loading/progress state; success/error message if callback fails.
- **Primary actions:** none; screen is mostly transactional.
- **Secondary actions / utilities:** return to login on failure.
- **Domain constraints:** успешный callback должен привести к обычной сессии приложения; logout после этого должен работать стандартно.
- **Entry / exit transitions:** entry from magic-link email; exit to `SCR-COMPANY-SWITCHER` or `SCR-APP-HOME`.

## `SCR-COMPANY-SWITCHER` — Company switcher
- **Route:** `/select-company`
- **Actors:** authenticated user with 1+ memberships
- **Purpose:** выбрать активную компанию/контекст работы.
- **Primary information:** список компаний пользователя; роль пользователя в каждой компании.
- **Primary actions:** select active company.
- **Secondary actions / utilities:** logout / back to login.
- **Domain constraints:** user может состоять в нескольких компаниях; активная компания влияет на все следующие HR/employee routes.
- **Entry / exit transitions:** entry after login when multiple memberships exist; exit to `SCR-APP-HOME`.

## `SCR-APP-HOME` — Internal home
- **Route:** `/`
- **Actors:** employee, manager, hr_admin, hr_reader
- **Purpose:** role-aware landing page with strongest current tasks and shortcuts.
- **Primary information:** role-specific summary card/hero; pending tasks / quick links; company context; shell navigation and account context.
- **Primary actions:** go to questionnaires; go to own results; go to team results; go to HR areas depending on role.
- **Secondary actions / utilities:** company switch; logout; account menu.
- **Domain constraints:** home must be role-aware; HR sees operational shortcuts, employee sees personal tasks, manager sees team shortcuts.
- **Entry / exit transitions:** entry after company selection; exit to any role-allowed area.

## `SCR-HR-EMPLOYEES` — Employee directory
- **Route:** `/hr/employees`
- **Actors:** hr_admin, hr_reader
- **Purpose:** HR master directory for people records.
- **Primary information:** summary of active/inactive employees; searchable/filterable employee list; per-row identity-first information: name, title, department, status, manager summary, contact snippets.
- **Primary actions:** search; filter by department/status; open employee detail; create employee (`hr_admin` only).
- **Secondary actions / utilities:** empty state messaging; read-only indicators for `hr_reader`.
- **Domain constraints:** soft delete/inactive markers must remain visible; user/account provisioning is related but not the primary list focus.
- **Entry / exit transitions:** entry from HR home/nav; exit to `SCR-HR-EMPLOYEE-CREATE` or `SCR-HR-EMPLOYEE-DETAIL`.

## `SCR-HR-EMPLOYEE-CREATE` — Employee create
- **Route:** `/hr/employees/new`
- **Actors:** hr_admin
- **Purpose:** create a new employee record in HR directory.
- **Primary information:** form fields for full name, email, phone, telegram placeholders, title, department/manager relations where applicable.
- **Primary actions:** save employee; cancel and return to directory.
- **Secondary actions / utilities:** validation errors; helper copy about invited/account lifecycle.
- **Domain constraints:** employee and auth user are different entities; HR admin creates accounts in advance.
- **Entry / exit transitions:** entry from `SCR-HR-EMPLOYEES`; exit to `SCR-HR-EMPLOYEE-DETAIL` or back to directory.

## `SCR-HR-EMPLOYEE-DETAIL` — Employee profile
- **Route:** `/hr/employees/[employeeId]`
- **Actors:** hr_admin, hr_reader
- **Purpose:** detailed HR profile of a person.
- **Primary information:** summary hero (name, role, title, department, manager, active/inactive state); provisioning/account block; department / manager / position history; contact data.
- **Primary actions:** edit profile fields (`hr_admin`); provision/update user linkage (`hr_admin`); return to directory.
- **Secondary actions / utilities:** show history records; read-only state for `hr_reader`.
- **Domain constraints:** user email may change and should update cleanly; history matters: department/manager/position changes are not disposable metadata.
- **Entry / exit transitions:** entry from directory; exit back to directory or related org/campaign workflows.

## `SCR-HR-ORG` — Org structure editor
- **Route:** `/hr/org`
- **Actors:** hr_admin, hr_reader
- **Purpose:** maintain departments and hierarchy.
- **Primary information:** department tree; selected department detail pane; manager of selected department; employees in unit; child departments / hierarchy.
- **Primary actions:** create/edit department (`hr_admin`); assign manager (`hr_admin`); move employee (`hr_admin`); select another node in tree.
- **Secondary actions / utilities:** tree expand/collapse; selected employee card; read-only mode for `hr_reader`.
- **Domain constraints:** org history matters; campaign snapshots later freeze org data at campaign start; hierarchy should visually show parent/child relationships clearly.
- **Entry / exit transitions:** entry from HR nav/home; exit to related employee detail or campaign prep.

## `SCR-HR-MODELS` — Competency models catalog
- **Route:** `/hr/models`
- **Actors:** hr_admin, hr_reader
- **Purpose:** manage model versions used by campaigns.
- **Primary information:** list of model versions; kind (`indicators` or `levels`); status (`draft`, `published`, etc.); usage hints / linked campaigns.
- **Primary actions:** create model draft; open model detail; clone draft where supported; filter/search.
- **Secondary actions / utilities:** show whether model is editable or read-only.
- **Domain constraints:** one model version is either indicators-based or levels-based; published versions are read-only; campaign points to `model_version_id`.
- **Entry / exit transitions:** entry from HR nav/home; exit to `SCR-HR-MODEL-CREATE` or `SCR-HR-MODEL-DETAIL`.

## `SCR-HR-MODEL-CREATE` — Model create
- **Route:** `/hr/models/new`
- **Actors:** hr_admin
- **Purpose:** start a draft competency model.
- **Primary information:** choose model kind; define groups/weights; start competencies scaffold.
- **Primary actions:** save draft; cancel.
- **Secondary actions / utilities:** validation and helper copy.
- **Domain constraints:** indicators mode uses score `1..5` + `NA`; levels mode uses levels `1..4` + `unsure`; later UI should show **distribution/mode**, not “average level”, as the primary signal.
- **Entry / exit transitions:** entry from models catalog; exit to `SCR-HR-MODEL-DETAIL`.

## `SCR-HR-MODEL-DETAIL` — Model detail/editor
- **Route:** `/hr/models/[modelVersionId]`
- **Actors:** hr_admin, hr_reader
- **Purpose:** edit draft or inspect published competency model version.
- **Primary information:** model summary; competency groups and weights; competencies; indicators or levels depending on mode.
- **Primary actions:** save draft (`hr_admin`, draft only); publish (`hr_admin`, draft only); clone draft from published where supported.
- **Secondary actions / utilities:** read-only published view; validation feedback.
- **Domain constraints:** after publish version becomes immutable; campaign start later freezes the chosen version for that campaign.
- **Entry / exit transitions:** entry from catalog; exit back to catalog or into campaign creation.

## `SCR-HR-CAMPAIGNS` — Campaigns list
- **Route:** `/hr/campaigns`
- **Actors:** hr_admin, hr_reader
- **Purpose:** portfolio view of campaigns.
- **Primary information:** counters by status; searchable/filterable campaign list; key metadata per campaign (status, date window, completion/progress, AI state).
- **Primary actions:** create campaign (`hr_admin`); open detail; filter by status.
- **Secondary actions / utilities:** empty states; read-only indicator for `hr_reader`.
- **Domain constraints:** campaign lifecycle is fixed: `draft → started → ended → processing_ai → ai_failed|completed`.
- **Entry / exit transitions:** entry from HR home/nav; exit to create/detail.

## `SCR-HR-CAMPAIGN-CREATE` — Campaign create
- **Route:** `/hr/campaigns/new`
- **Actors:** hr_admin
- **Purpose:** create campaign draft.
- **Primary information:** selected model; start/end dates; timezone; weights; basic settings.
- **Primary actions:** save draft; cancel.
- **Secondary actions / utilities:** validation; helper copy on defaults and weights.
- **Domain constraints:** draft is editable; self weight default = `0%`; missing groups require dynamic weight normalization later.
- **Entry / exit transitions:** entry from campaigns list; exit to campaign detail/edit flow.

## `SCR-HR-CAMPAIGN-DETAIL` — Campaign detail
- **Route:** `/hr/campaigns/[campaignId]`
- **Actors:** hr_admin, hr_reader
- **Purpose:** operational workbench for one campaign.
- **Primary information:** summary hero (status, timeline, progress, lock state, AI state); participants summary; matrix/reminders/results sections; operational diagnostics.
- **Primary actions:** start draft campaign (`hr_admin`); stop/end where allowed (`hr_admin`); open matrix builder; open edit for draft; open results workbench.
- **Secondary actions / utilities:** AI retry; progress refresh; reminder/notification access.
- **Domain constraints:** after `started`, model and participant set are frozen; after first questionnaire `draft save`, matrix/weights become locked; after `ended`, questionnaires are read-only.
- **Entry / exit transitions:** entry from campaign list; exit to edit/matrix/results/notifications.

## `SCR-HR-CAMPAIGN-EDIT` — Campaign edit
- **Route:** `/hr/campaigns/[campaignId]/edit`
- **Actors:** hr_admin
- **Purpose:** edit draft campaign configuration.
- **Primary information:** editable draft fields; current selected model / dates / settings.
- **Primary actions:** save changes; cancel back to detail.
- **Secondary actions / utilities:** validation state.
- **Domain constraints:** only draft campaigns are editable here; once started, route should effectively become unavailable or read-only.
- **Entry / exit transitions:** entry from detail; exit back to detail.

## `SCR-HR-CAMPAIGN-MATRIX` — Matrix builder
- **Route:** `/hr/campaigns/[campaignId]/matrix`
- **Actors:** hr_admin, hr_reader
- **Purpose:** assign who evaluates whom.
- **Primary information:** subjects/participants; suggested raters by role/group; matrix rows grouped by manager / peers / subordinates / self.
- **Primary actions:** autogenerate from departments/org (`hr_admin`); add/remove assignments (`hr_admin`); save matrix (`hr_admin`).
- **Secondary actions / utilities:** lock preview; read-only view for `hr_reader`.
- **Domain constraints:** before first questionnaire `draft save`, matrix is editable; after lock it is read-only; one rater may have different roles for different subjects.
- **Entry / exit transitions:** entry from campaign detail; exit back to detail.

## `SCR-HR-NOTIFICATIONS` — Notification center
- **Route:** `/hr/notifications`
- **Actors:** hr_admin, hr_reader
- **Purpose:** configure reminders/templates and inspect deliveries.
- **Primary information:** reminder schedule editor; template catalog and preview; delivery diagnostics / attempts.
- **Primary actions:** update reminder settings (`hr_admin`); preview templates; inspect deliveries and retries.
- **Secondary actions / utilities:** filter by campaign/channel/status.
- **Domain constraints:** MVP actual sending is email-first; notification subsystem is adapter-based; test adapter exists for scenarios, but end-user UI still reflects operational status.
- **Entry / exit transitions:** entry from HR nav or campaign workflow; exit back to campaign detail or HR home.

## `SCR-QUESTIONNAIRES-INBOX` — Questionnaire inbox
- **Route:** `/questionnaires`
- **Actors:** employee, manager, hr_admin, hr_reader (when they have assigned questionnaires)
- **Purpose:** show assigned questionnaires and current work progress.
- **Primary information:** counters by status; questionnaire list with subject, campaign, role in evaluation, status, due/end context.
- **Primary actions:** open questionnaire; filter by status/campaign.
- **Secondary actions / utilities:** empty state; status hints.
- **Domain constraints:** submitted questionnaires become read-only; after campaign end everything is read-only.
- **Entry / exit transitions:** entry from home/nav; exit to `SCR-QUESTIONNAIRES-FILL`.

## `SCR-QUESTIONNAIRES-FILL` — Questionnaire fill
- **Route:** `/questionnaires/[questionnaireId]`
- **Actors:** questionnaire assignee
- **Purpose:** complete one assessment form.
- **Primary information:** questionnaire summary/progress; competency blocks; inputs per competency; optional comment per competency; optional final comment.
- **Primary actions:** save draft; submit questionnaire.
- **Secondary actions / utilities:** read-only state; inline validation.
- **Domain constraints:** indicators mode uses `1..5` + `NA`; levels mode uses `1..4` + `unsure`; comments are optional; first `draft save` anywhere in campaign sets campaign lock; after submit or after campaign end form is read-only.
- **Entry / exit transitions:** entry from inbox; exit back to inbox or stay as submitted/read-only.

## `SCR-RESULTS-EMPLOYEE` — Employee results dashboard
- **Route:** `/results`
- **Actors:** employee
- **Purpose:** show personal 360 outcome in privacy-safe way.
- **Primary information:** summary hero / overview; group cards (manager, peers, subordinates, self); competency sections; processed summary insights.
- **Primary actions:** switch campaign where available; expand competency sections.
- **Secondary actions / utilities:** methodology/anonymity notes.
- **Domain constraints:** raw comments are **not** shown; self is visible but has weight `0%`; manager is never anonymous; small groups follow anonymity threshold; for level-based models, show **distribution/mode**, not average as primary signal.
- **Entry / exit transitions:** entry from home/nav; exit back to home or other internal pages.

## `SCR-RESULTS-MANAGER` — Manager results dashboard
- **Route:** `/results/team`
- **Actors:** manager
- **Purpose:** view results for subordinates/team members.
- **Primary information:** selected subject summary; role-safe group results; competency breakdown; processed insights.
- **Primary actions:** switch subject; switch campaign if available.
- **Secondary actions / utilities:** explanations when groups are hidden/merged.
- **Domain constraints:** manager sees no raw comments; anonymity threshold still applies; manager identity remains explicit where relevant, but peer/subordinate groups may be hidden or merged.
- **Entry / exit transitions:** entry from home/nav; stays within screen when switching subject.

## `SCR-RESULTS-HR` — HR results workbench
- **Route:** `/results/hr`
- **Actors:** hr_admin, hr_reader
- **Purpose:** full HR analysis surface for campaign outcomes.
- **Primary information:** campaign and subject filters; summary hero and diagnostics; group and competency sections; processed summary; raw/original comments for `hr_admin`.
- **Primary actions:** switch campaign; switch subject; inspect processed vs raw views; move to related campaign workflow.
- **Secondary actions / utilities:** AI status / diagnostics; redaction-aware visibility hints for `hr_reader`.
- **Domain constraints:** `hr_admin` sees original + processed; `hr_reader` does **not** see raw comments; anonymity rules still apply to group-level presentation.
- **Entry / exit transitions:** entry from campaign detail or nav; stays on screen with filters, or exits back to campaign detail.

## `SCR-OPS` — Ops dashboard
- **Route:** `/ops`
- **Actors:** hr_admin, hr_reader
- **Purpose:** operational health/release/diagnostics console.
- **Primary information:** health/release card; AI/webhook diagnostics; audit/release trace information.
- **Primary actions:** inspect diagnostics; filter operational records.
- **Secondary actions / utilities:** debug metadata.
- **Domain constraints:** this is not a primary end-user surface and should remain secondary in visual priority.
- **Entry / exit transitions:** entry from nav; exit back to operational HR flows.

## Redesign notes for domain-sensitive behavior
- **Anonymity:** threshold is `3` for peers/subordinates; manager is always non-anonymous; employee sees only aggregated/processed text.
- **Weights:** self has `0%` weight; if a group is absent/hidden, effective weights are recalculated.
- **Questionnaire lock:** first `draft save` in any questionnaire locks matrix/weights at campaign level.
- **Campaign freeze:** after `started`, model and participant set are frozen; after `ended`, questionnaires are read-only.
- **Levels model:** UI should present chosen level distribution and mode; average over levels is not the main visual signal.
- **HR vs HR Reader:** `hr_reader` keeps broad visibility but without raw sensitive content or destructive actions.

## Recommended use in redesign tools
- Use `screen_id` as the stable identifier for frames/artboards.
- Preserve route-level boundaries from the screen registry.
- For every redesign proposal, keep these explicit:
  - primary user goal on screen;
  - primary data blocks;
  - primary CTA;
  - state variants;
  - role-specific differences;
  - domain-sensitive visibility/freeze/anonymity behavior.
