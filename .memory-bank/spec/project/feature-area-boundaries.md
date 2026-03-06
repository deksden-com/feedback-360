# Feature-area boundaries
Status: Draft (2026-03-06)

Цель: зафиксировать целевые **ownership boundaries** между feature areas после EP-014, чтобы структура кода отвечала не только на вопрос “куда положить файл”, но и на вопрос “почему этот код принадлежит именно этой области”.

Связанные документы (аннотированные ссылки):
- [Repo structure (target)](repo-structure.md): целевая структура монорепо и базовые пути для slices. Читать, чтобы понимать layout на уровне папок и packages.
- [Layers & vertical slices](layers-and-vertical-slices.md): layered model и definition of done вертикального слайса. Читать, чтобы feature areas не разорвали сквозную delivery-модель.
- [Architecture guardrails](../engineering/architecture-guardrails.md): границы импортов и thin-clients policy. Читать, чтобы ownership boundaries не превратились в скрытую связанность.
- [ADR 0004 — Feature-area slicing boundaries](../../adr/0004-feature-area-slicing-boundaries.md): rationale выбора именно этих областей и ограничений на `shared`. Читать, чтобы понимать WHY, а не только target paths.

## Canonical feature areas
- `identity-tenancy`
  - Владеет: memberships, active company context, company-scoped user↔employee linking, base access-context helpers.
  - Не владеет: org history, questionnaire flow, result shaping.
- `org`
  - Владеет: departments, manager relations, org history, employee moves.
  - Не владеет: campaign lifecycle и matrix policy как продуктовым поведением.
- `models`
  - Владеет: competency model versions, model draft/publish lifecycle, model structures.
  - Не владеет: campaign operations и questionnaire persistence.
- `campaigns`
  - Владеет: campaign lifecycle, lock semantics, participants, weights, progress, HR campaign operational flows.
  - Не владеет: questionnaire answer editing и result aggregation internals.
- `matrix`
  - Владеет: assignments generation, manual matrix edits, assignment orchestration.
  - Не владеет: org history itself и campaign lifecycle целиком.
- `questionnaires`
  - Владеет: assigned questionnaires, draft/save/submit, read-only states, questionnaire-specific access.
  - Не владеет: campaign lifecycle rules beyond questionnaire-facing constraints.
- `results`
  - Владеет: aggregations, anonymity shaping, results visibility shaping, actor dashboards/views.
  - Не владеет: questionnaire authoring/editing и AI job orchestration.
- `notifications`
  - Владеет: outbox, reminder planning, template preview/delivery diagnostics, delivery orchestration.
  - Не владеет: campaign lifecycle как таковым, только реагирует на события/inputs.
- `ai`
  - Владеет: AI jobs, webhook handling, processed text lifecycle, retry/diagnostics.
  - Не владеет: базовыми questionnaire/campaign правилами.

## Shared modules (strict rule)
`shared` допустим только если модуль:
1) используется несколькими feature areas,
2) не выражает самостоятельное product behavior,
3) не имеет одного очевидного owner.

Допустимые shared категории:
- result/error wrappers and dispatch plumbing,
- auth/context resolution primitives,
- common parsing helpers,
- shared UI shell/primitives and generic page-state wrappers,
- testkit helpers/builders.

Недопустимые кандидаты в shared:
- “generic” campaign/questionnaire/results helpers, которые фактически принадлежат одной области,
- доменные policies (`anonymity`, `freeze`, `started immutability`) без сильного основания,
- utility-модули без ownership и без объяснённой ответственности.

## Root composition points
Root entrypoints допустимы только как thin composition layer:
- `packages/core/src/index.ts`
- `packages/api-contract/src/index.ts`
- `packages/client/src/index.ts`
- `packages/cli/src/index.ts`

Их допустимая роль:
- собрать exports,
- маршрутизировать вызовы,
- подключить adapters/composition,
- сослаться на owning feature areas.

Их недопустимая роль:
- быть главным местом жизни feature logic,
- скрывать ownership behind giant switch/registry files,
- требовать постоянного редактирования при каждой новой фиче.

## Boundary heuristics
Если неясно, куда положить модуль, задаём вопросы:
1) Какой product behavior сломается, если модуль сломается?
2) Какая feature area меняется вместе с ним чаще всего?
3) Есть ли у него один естественный owner?

Если owner один, модуль идёт в owner area.
Если owner не один и модуль выражает только infrastructure/helper role, допускаем `shared`.

## Docs ↔ code expectation
После EP-014 ключевые slice entrypoints и root composition files должны иметь двустороннюю навигацию:
- code → docs через `@docs` / `@see`,
- docs → code через file links на owning paths.

Это нужно, чтобы агент мог быстро восстановить:
- где WHAT по области,
- где WHY по границам,
- где начинается HOW в коде.
