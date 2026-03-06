# EP-014 — Feature-area slice refactor
Status: Planned (2026-03-06)

## Goal
Перестроить кодовую базу под явные feature areas перед следующей волной GUI-эпиков, чтобы будущие изменения были локальнее, безопаснее и быстрее в сопровождении.

## Scope
- In scope: target feature-area layout для `core` / `api-contract` / `client` / `cli` / `apps/web`, политика shared-модулей, перенос существующего runtime-кода в новую структуру без изменения бизнес-поведения, обновление Memory Bank и verification artifacts.
- Out of scope: новые бизнес-правила, новые пользовательские возможности, пересмотр доменной модели, redesign DB schema beyond what is strictly needed for modularization.

## Feature areas (target model)
- `identity-tenancy`
- `org`
- `models`
- `campaigns`
- `matrix`
- `questionnaires`
- `results`
- `notifications`
- `ai`
- `shared` only for code reused by multiple areas and not owning product behavior by itself.

## Features (vertical slices)
- [Feature catalog](features/index.md): FT-0141..FT-0143. Читать, чтобы провести refactor как проверяемую серию slices, а не как “большой перенос файлов”.

## Dependencies
- [EP-009 Test & release hardening](../EP-009-test-release-hardening/index.md): regression safety net, beta smoke gates и evidence discipline. Читать, чтобы refactor не разрушил merge/release path.
- [EP-010 Production readiness](../EP-010-prod-readiness/index.md): observability/runbook/deploy expectations. Читать, чтобы refactor завершался подтверждением на реальном окружении, а не только локально.
- [EP-011 App shell and navigation](../EP-011-app-shell-navigation/index.md): общий UI shell уже стабилизирован и должен пережить перенос без regressions.
- [EP-012 HR campaigns UX](../EP-012-hr-campaigns-ux/index.md): текущий самый насыщенный HR surface станет одним из главных regression targets после реорганизации.
- [EP-013 Questionnaire experience](../EP-013-questionnaire-experience/index.md): refactor стартует только после закрытия questionnaire UX, чтобы не ломать активную delivery branch.

## Risks & mitigations
- Risk: “перенос ради переноса” без измеримого выигрыша в сопровождении.
  - Mitigation: сначала фиксируем target feature-area map и shared-module policy, потом переносим код строго по ней.
- Risk: скрытые runtime regressions из-за массового перемещения файлов и импортов.
  - Mitigation: required regression suite на package level + Playwright smoke + manual beta verification.
- Risk: дублирование общего кода внутри slices.
  - Mitigation: отдельный slice на shared-module extraction с правилами “что остаётся shared, а что должно жить рядом с owning feature area”.
- Risk: расхождение Memory Bank, verification matrix и будущих GUI-эпиков.
  - Mitigation: в scope эпика входит полный docs refactor с обновлением ссылок, numbering, route/visual mapping и acceptance expectations для следующих эпиков.
- Risk: длинноживущая ветка и тяжёлый merge после EP-013.
  - Mitigation: выполнять refactor короткими FT-срезами с промежуточно зелёным `pnpm checks`, а deploy verification делать только после convergence всех slices.

## Progress report (evidence-based)
- `as_of`: 2026-03-06
- `total_features`: 3
- `completed_features`: 0
- `evidence_confirmed_features`: 0
- verification link:
  - [Verification matrix](../../verification-matrix.md): сюда пойдут regression, docs audit и beta smoke evidence по refactor. Читать, чтобы refactor считался завершённым только после доказуемой стабилизации.

## Definition of done
- Существующий runtime-код разложен по целевым feature areas во всех основных delivery/layer packages, а root entrypoints стали thin composition points.
- Для каждого shared модуля есть явное обоснование, почему он shared, а не принадлежит конкретному feature area.
- Обновлены SSoT документы по структуре репозитория, feature-area boundaries, architecture guardrails, implementation playbook и планы следующих эпиков.
- Зафиксирован WHY слоя code organization: через ADR и через L3/project docs, а не только через новую раскладку файлов.
- Следующие planned эпики (results, people/org, models/matrix, notifications UI, ops UI) переназначены на новую структуру и не ссылаются на устаревшие пути/номера.
- Пройдены `pnpm checks`, релевантные DB tests, `pnpm docs:audit`, Playwright regression smoke и manual beta verification на ключевых user journeys.
- Есть CI run + beta deployment evidence, подтверждающее, что refactor не сломал работающий продукт.
