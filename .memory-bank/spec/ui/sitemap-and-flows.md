# UI sitemap + flows (minimal)
Status: Updated (2026-03-06)

## Current implemented MVP surfaces
### Shared
- Login (magic link)
- Company switcher (если membership > 1)
- Minimal internal home
- Internal app shell / role-aware navigation для `/`, `/questionnaires`, `/results*`, `/hr/campaigns`
- Role-aware home dashboards для `employee`, `manager`, `hr_admin`/`hr_reader`
- Shared loading/empty/error states для `/`, `/questionnaires`, `/questionnaires/[questionnaireId]`, `/results*`, `/hr/campaigns`, `/select-company`

### HR
- HR campaign workbench (`/hr/campaigns`)

### Employee
- My questionnaires:
  - inbox counters (`total / in progress / submitted`)
  - filters by status and campaign
  - resume/open CTA per questionnaire
- Questionnaire fill:
  - structured indicators/levels sections
  - progress card
  - per-competency comments
  - final comment
  - save draft / submit
  - explicit read-only for submitted/ended
- My results dashboard

### Manager
- Team results

## Planned GUI expansion (post-MVP wave)
Ниже — целевая карта экранов для GUI-эпиков EP-011..EP-019. Это не значит “делаем всё сразу”, а означает куда развивается IA приложения.
EP-014 в этой последовательности — внутренний feature-area refactor: он не добавляет новых экранов, но меняет foundation, на котором строятся последующие UI-эпики.

## Shared
- Login (magic link)
- Company switcher (если membership > 1)
- Internal app shell / role-aware navigation
- Role-aware home dashboards
- Shared loading/empty/error states

## HR
- Directory: Employees
- Org structure: Departments + managers
- Competency models: versions
- Campaigns list
- Campaign detail:
  - participants
  - matrix (auto-suggest + manual edit)
  - reminders settings
  - progress
  - results + AI retry
- Notification center:
  - schedules
  - templates
  - delivery diagnostics
- HR campaign workbench (`/hr/campaigns`):
  - campaign create/start/stop/end
  - participants add/remove/add-from-departments
  - matrix generate/apply (до lock)
  - weights apply (до lock)
  - progress refresh
  - AI retry

## Employee
- My questionnaires (assigned)
- Questionnaire fill (draft/save/submit)
- My results dashboard

## Manager
- Team results (subject dashboards) с анонимностью

## Admin / Ops
- Health + release dashboard
- AI job / webhook diagnostics
- Audit trail / release console

## Planned route groups (tentative)
- `/(app)` — internal shell routes.
- `/home` — role-aware landing.
- `/hr/campaigns`, `/hr/campaigns/[campaignId]`
- `/hr/campaigns/new`, `/hr/campaigns/[campaignId]/edit`
- `/hr/employees`, `/hr/employees/[employeeId]`
- `/hr/org`
- `/hr/models`, `/hr/models/[modelId]`
- `/hr/notifications`
- `/ops`

## Current implemented HR campaign routes
- `/hr/campaigns`
  - HR campaign list/dashboard with status counters, status filters and deep links to detail pages.
- `/hr/campaigns/new`
  - Draft-first campaign creation form: model, dates, timezone and weights.
- `/hr/campaigns/[campaignId]`
  - Campaign detail dashboard with overview, progress, lock state and operational workbench.
- `/hr/campaigns/[campaignId]/edit`
  - Draft-only edit flow for base campaign configuration.

## Related plans
- [EP-011 App shell and navigation](../../plans/epics/EP-011-app-shell-navigation/index.md): единый каркас приложения и home dashboards. Читать, чтобы понять ближайший UI слой после MVP.
- [EP-012 HR campaigns UX](../../plans/epics/EP-012-hr-campaigns-ux/index.md): HR campaign surfaces поверх текущего workbench. Читать, чтобы связать sitemap с реальными business flows.
- [EP-013 Questionnaire experience](../../plans/epics/EP-013-questionnaire-experience/index.md): эволюция inbox/fill/read-only flow. Читать, чтобы questionnaire screens оставались user-centered.
- [EP-014 Feature-area slice refactor](../../plans/epics/EP-014-feature-area-slices-refactor/index.md): структурная реорганизация кода и docs перед следующими GUI-эпиками. Читать, чтобы понимать, почему после EP-013 в roadmap нет новых routes, но есть обязательный refactor step.
- [EP-015 Results experience](../../plans/epics/EP-015-results-experience/index.md): employee/manager/HR results dashboards. Читать, чтобы корректно развивать reporting surface.
