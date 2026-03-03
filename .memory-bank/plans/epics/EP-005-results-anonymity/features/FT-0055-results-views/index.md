# FT-0055 — Results views (employee/manager/hr)
Status: Draft (2026-03-03)

## User value
Каждая роль видит “свою” витрину результатов без нарушения приватности и анонимности.

## Deliverables
- `results.getMyDashboard` (employee)
- `results.getTeamDashboard` (manager)
- `results.getHrView` (hr_admin/hr_reader)
- Open text:
  - employee/manager: только AI processed/summary
  - HR: raw + processed (HR reader raw видит в MVP)

## Context (SSoT links)
- [Results visibility](../../../../../spec/domain/results-visibility.md): SSoT правил “кто что видит”. Читать, чтобы response shape не раскрывал raw open text не тем ролям.
- [Anonymity policy](../../../../../spec/domain/anonymity-policy.md): hide/merge и threshold. Читать, чтобы витрины выдавали “безопасные” группы.
- [AI processing](../../../../../spec/ai/ai-processing.md): что такое processed/summary и где хранится. Читать, чтобы витрины ссылались на правильные поля.
- [RBAC spec](../../../../../spec/security/rbac.md): роли и allowed ops. Читать, чтобы доступ к HR view был только для hr_*.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист. Читать, чтобы витрины были тонкими над core вычислениями.

## Acceptance (auto)
### Setup
- Seed: `S9_campaign_completed_with_ai --json` → `handles.campaign.main`

### Action (CLI, `--json`) (planned auth contexts)
1) Под employee: `results my --campaign <handles.campaign.main> --json`
2) Под manager: `results team --campaign <handles.campaign.main> --subject <employee_id> --json`
3) Под hr_reader: `results hr --campaign <handles.campaign.main> --subject <employee_id> --json`

### Assert
- Employee/Manager response не содержит raw open text полей.
- HR view содержит raw open text (MVP) и processed/summary.

## Implementation plan (target repo)
- Contract:
  - Определить три distinct output DTO (или один DTO с role-based shaping на сервере, но лучше — явные различия):
    - employee dashboard,
    - manager/team dashboard,
    - HR view (самый полный).
  - Явно указать в схемах, какие поля могут присутствовать (чтобы “raw” нельзя было случайно вернуть employee).
- Core:
  - Общая функция “compute results” (или сервис) возвращает полный internal representation.
  - Затем “view shaping” (role-based) отрезает поля согласно visibility + RBAC.
- Тонкие моменты:
  - “HR Reader видит raw (MVP)” — это осознанное исключение; держим его в одном месте (policy), чтобы легко убрать позже.
  - При отсутствии AI processed данных employee должен получать пусто/placeholder, но не raw.

## Tests
- Integration: один и тот же кампейн:
  - employee results не содержит raw,
  - manager results не содержит raw,
  - hr_reader/hr_admin results содержит raw.
- Contract: runtime-схемы гарантируют отсутствие raw полей в employee DTO.

## Memory bank updates
- При изменении видимости обновить: [Results visibility](../../../../../spec/domain/results-visibility.md) — SSoT. Читать, чтобы политика приватности была единой во всех витринах.

## Verification (must)
- Automated test: `packages/core/test/ft/ft-0055-results-views.test.ts` (integration) проверяет role-based shaping (employee/manager без raw, HR с raw) и анонимность flags.
- Must run: GS1 (happy path) должен оставаться зелёным (включая “кто что видит”).
