# EP-015 — Results experience
Status: Completed (2026-03-06)

## Goal
Сделать результаты удобными и визуально понятными для employee, manager и HR, сохранив все правила visibility, anonymity и raw/processed separation.

## Scope
- In scope: employee results dashboard, manager team view, HR results workbench, charts/cards/state messaging.
- Out of scope: изменение самих формул и anonymity rules; эти правила уже описаны в domain spec.

## Features (vertical slices)
- [Feature catalog](features/index.md): FT-0151..FT-0153. Читать, чтобы каждый actor получил свой results surface без конфликта с RBAC и privacy.

## Dependencies
- [EP-005 Results + anonymity + weights](../EP-005-results-anonymity/index.md): расчёты и правила скрытия/слияния. Читать, чтобы UI отражал их корректно.
- [EP-007 AI processing + webhook security](../EP-007-ai-webhooks/index.md): processed texts и summaries. Читать, чтобы results UI не путал raw и processed поля.
- [EP-014 Feature-area slice refactor](../EP-014-feature-area-slices-refactor/index.md): новая feature-area structure для `results` и shared reporting modules. Читать, чтобы implementation сразу шёл по целевой структуре.

## Progress report (evidence-based)
- `as_of`: 2026-03-06
- `total_features`: 3
- `completed_features`: 3
- `evidence_confirmed_features`: 3
- verification link:
  - [Verification matrix](../../verification-matrix.md): execution evidence для будущих results UX фич. Читать, чтобы acceptance закрывал и визуализацию, и privacy behavior.

## Definition of done
- Employee получает понятный личный dashboard без raw text.
- Manager видит только разрешённые team results с корректной анонимностью.
- HR получает расширенный workbench с processed/raw diagnostics, но без обхода existing permissions.

## Current status
- Closed:
  - [FT-0151 Employee results dashboard](features/FT-0151-employee-results-dashboard/index.md): employee results page пересобрана в dashboard с summary, group cards и AI-text insights.
  - [FT-0152 Manager team results dashboard](features/FT-0152-manager-results-dashboard/index.md): manager surface получил subject switcher, merge/hide explanations и safe team drill-down.
  - [FT-0153 HR results workbench](features/FT-0153-hr-results-workbench/index.md): HR workbench получил campaign/subject filters и `hr_admin` text-mode controls без нарушения visibility policy.

## Completion note (2026-03-06)
- EP-015 закрыт полностью:
  - все три results surfaces теперь используют единый, более продуктовый presentation layer поверх существующих typed operations;
  - privacy и anonymity rules остались доменно-управляемыми, а UI лишь объясняет `shown|hidden|merged` и redaction behavior;
  - regression acceptance зелёный локально для legacy FT-0083/FT-0101 и новых FT-0151..FT-0153;
  - PR [#40](https://github.com/deksden-com/feedback-360/pull/40) смержен в `develop`, а production deployment `https://beta.go360go.ru` подтверждён после merge commit `82eb507975ceda162f29e53c42cfd0ba8fb2bcaf`.
