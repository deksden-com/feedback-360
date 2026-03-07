# UI redesign — screen by screen
Status: Draft (2026-03-07)

Цель: пройтись по текущим экранам приложения и зафиксировать, **что именно стоит улучшить**, сохранив всю существующую функциональность и доменные ограничения.

Связанные документы:
- [UI design principles](design-principles.md) — общие принципы content-first UI, familiar SaaS shell и CRUD/dashboard patterns. Читать первым, чтобы рекомендации ниже не воспринимались как случайный список пожеланий.
- [UI sitemap & flows](sitemap-and-flows.md) — текущая карта экранов и маршрутов. Читать, чтобы соотнести предложения с уже реализованными surfaces.
- [Manual tutorial: first campaign](../../guides/tutorials/run-first-360-campaign-manually.md) — живой walkthrough текущего продукта со скриншотами. Читать, чтобы видеть, как экраны ощущаются в реальном потоке.

## Shared shell and identity surfaces
### `/auth/login`
#### Что хорошо
- минимальный и понятный login surface;
- есть magic link path;
- есть dev/beta-only helpers.

#### Что улучшить
- сделать layout ближе к современному SaaS auth screen:
  - слева branding/value proposition,
  - справа компактная auth card;
- отделить обычный product login от dev helpers визуально сильнее;
- добавить короткий hint “какой способ входа основной”.

#### Common pattern
- clean auth card + secondary helper panel;
- supportive microcopy instead of bare controls.

### `/select-company`
#### Что улучшить
- сделать screen не “списком кнопок”, а selector card list:
  - company name,
  - role in company,
  - last active / hint,
  - clear primary CTA “Open workspace”.
- показать текущий user identity в top area.

## Global app shell
### Current issue
Сейчас shell функциональный, но не вполне “современный SaaS”:
- identity пользователя не читается как identity;
- `Company ID` визуально заметнее, чем имя пользователя;
- sign out/switch company живут как utility buttons, а не как user/account menu.

### Что сделать
- добавить top-right user menu:
  - avatar/initials,
  - display name or email,
  - role label,
  - active company,
  - switch company,
  - sign out;
- перенести `Company ID` в low-visibility details drawer/tooltip/secondary metadata;
- sidebar сгруппировать по смыслу:
  - My work
  - HR admin
  - Ops
- добавить breadcrumbs/page context в header.

### Expected effect
- интерфейс станет восприниматься как зрелый SaaS workspace;
- меньше cognitive load при переключении между разделами;
- user/account control станет привычным.

## Home
### `/`
#### Current issue
- home уже лучше, чем раньше, но пока слишком “карточки со ссылками”;
- не хватает ощущения priority/urgency.

#### Что сделать
- верхний hero:
  - приветствие,
  - active role,
  - current company,
  - 1 primary CTA;
- ниже блок “Что требует внимания сейчас”;
- потом 3–4 KPI cards;
- потом secondary explainers.

#### By role
- `employee`: анкеты и сроки;
- `manager`: команда и pending reviews/results;
- `hr_admin`: active campaigns, response rate, reminders/AI blockers;
- `hr_reader`: read-only overview and result shortcuts.

## HR CRUD surfaces
### `/hr/employees`
#### Current issue
- экран уже рабочий, но можно сильнее приблизить к общепринятому CRUD каталогу.

#### Что сделать
- unified toolbar:
  - search,
  - department filter,
  - status filter,
  - primary `Создать сотрудника`;
- list/cards should emphasize:
  - name,
  - role/position,
  - department,
  - status,
  - contact summary;
- сделать row/card кликабельным целиком;
- вторичные действия убрать в compact row menu.

### `/hr/employees/new`
#### Что сделать
- разбить форму на 2 секции:
  - identity/contact
  - org/work context
- добавить helper text под risky fields;
- sticky footer/header actions: `Сохранить`, `Отмена`.

### `/hr/employees/[employeeId]`
#### Что сделать
- header с именем, статусом, должностью, department chip;
- summary слева, provisioning/history справа или в secondary rail;
- history показывать блоками/таймлайном, а не однотипным длинным полотном;
- edit action near title.

### `/hr/org`
#### Что сделать
- двухпанельный layout:
  - слева tree/department list,
  - справа details/editor;
- выделить selected department clearly;
- manager/employee assignment оформить как explicit cards, not just controls;
- добавить breadcrumb-like context внутри дерева.

## Models
### `/hr/models`
#### Что сделать
- сделать catalog more CRUD-native:
  - search + kind/status filters + primary create button in toolbar;
- модели показывать карточками:
  - name,
  - version,
  - kind,
  - status,
  - number of competencies/groups;
- secondary actions (`clone`, `publish`) через action menu или detail page.

### `/hr/models/new` and `/hr/models/[modelVersionId]`
#### Что сделать
- editor должен быть content-first:
  - сверху summary/version/status,
  - ниже sections:
    - groups,
    - competencies,
    - indicators/levels,
    - validation;
- validation summary закрепить сверху;
- save/publish area сделать sticky и очень явной.

## Campaigns
### `/hr/campaigns`
#### Current issue
- экран полезный, но по hierarchy ещё похож на “набор blocks + filters”.

#### Что сделать
- header:
  - title,
  - active campaign count,
  - primary CTA `Создать кампанию`;
- summary strip:
  - draft / started / ended / processing / completed;
- затем “Requires attention”:
  - low response campaigns,
  - AI failed,
  - ending soon;
- затем main campaign list.

#### Common pattern
- portfolio dashboard first, CRUD list second.

### `/hr/campaigns/new`
#### Что сделать
- wizard-like composition:
  1. basics
  2. model and dates
  3. weights/reminders
  4. review/save
- даже если route остаётся одной страницей, визуально секции должны быть читаемы как шаги.

### `/hr/campaigns/[campaignId]`
#### This is one of the highest-value redesign targets
#### Что сделать
- header:
  - campaign name,
  - status badge,
  - date range,
  - primary action;
- hero summary:
  - progress,
  - response rate,
  - lock state,
  - AI state;
- main sections:
  - overview,
  - participants,
  - matrix,
  - reminders,
  - results;
- diagnostics and low-frequency actions вынести вниз/right rail.

### `/hr/campaigns/[campaignId]/matrix`
#### Что сделать
- matrix builder сделать ближе к “assignment workspace”:
  - subject selector,
  - grouped raters,
  - suggested vs manual markers,
  - lock explanation banner;
- counts and completeness above the fold.

## Questionnaires
### `/questionnaires`
#### What to improve
- inbox should feel task-oriented:
  - `To do / In progress / Submitted` segmented control,
  - due date emphasis,
  - target person prominence,
  - campaign/context as secondary metadata;
- each questionnaire row/card should answer:
  - for whom,
  - in which campaign,
  - current status,
  - what to do now.

### `/questionnaires/[questionnaireId]`
#### This is another highest-value redesign target
#### Что сделать
- sticky top area:
  - questionnaire status,
  - save state,
  - progress,
  - due date;
- main area:
  - one competency per section/card,
  - score controls + comment visually bound together;
- side rail or sticky summary:
  - competency navigation,
  - completion count,
  - submit readiness;
- submit CTA visually distinct from save draft.

## Results
### `/results`
#### What to improve
- turn it into a report/dashboard, not just result blocks;
- top summary hero:
  - overall summary,
  - key strengths/gaps,
  - visibility note;
- then group blocks;
- then competency insights;
- then processed comments/summary.

### `/results/team`
#### What to improve
- manager should land on a team-oriented overview:
  - subject switcher,
  - campaign selector,
  - summary block,
  - group explanation,
  - result content;
- keep anonymity explanations close to hidden/merged groups.

### `/results/hr`
#### What to improve
- HR results should feel like a proper “analysis workspace”:
  - campaign + subject filters in a top toolbar,
  - summary hero,
  - diagnostics cards,
  - result content,
  - raw/processed text section lower on page or in dedicated accordion/tabs;
- `hr_reader` and `hr_admin` must share structure but differ in sensitive content.

## Notifications
### `/hr/notifications`
#### What to improve
- split into tabs or clear sections:
  - schedules,
  - templates,
  - delivery diagnostics;
- template preview should feel content-centered, not configuration-centered;
- diagnostics should emphasize meaningful delivery states, not raw mechanics.

## Ops
### `/ops`
#### What to improve
- keep utility-heavy nature, but still structure:
  - health/release
  - AI/webhooks
  - audit/recent events
- separate “product ops” from “deep diagnostics” visually;
- do not let ops idioms leak into product-facing screens.

## Prioritization
### Highest-impact redesign targets
1. Global app shell
2. `/hr/campaigns`
3. `/hr/campaigns/[campaignId]`
4. `/questionnaires/[questionnaireId]`
5. `/results`
6. `/results/team`
7. `/results/hr`

### Medium-impact
1. `/`
2. `/hr/employees`
3. `/hr/models`
4. `/hr/notifications`

### Low-risk polish
1. `/auth/login`
2. `/select-company`
3. `/ops`

## Suggested implementation order
1. Shell and identity chrome
2. Campaign portfolio and detail
3. Questionnaire fill
4. Results dashboards
5. CRUD polish for employees/models/org
6. Notifications and ops polish
