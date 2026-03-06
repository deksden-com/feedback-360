# EP-014 — Results experience
Status: Planned (2026-03-06)

## Goal
Сделать результаты удобными и визуально понятными для employee, manager и HR, сохранив все правила visibility, anonymity и raw/processed separation.

## Scope
- In scope: employee results dashboard, manager team view, HR results workbench, charts/cards/state messaging.
- Out of scope: изменение самих формул и anonymity rules; эти правила уже описаны в domain spec.

## Features (vertical slices)
- [Feature catalog](features/index.md): FT-0141..FT-0143. Читать, чтобы каждый actor получил свой results surface без конфликта с RBAC и privacy.

## Dependencies
- [EP-005 Results + anonymity + weights](../EP-005-results-anonymity/index.md): расчёты и правила скрытия/слияния. Читать, чтобы UI отражал их корректно.
- [EP-007 AI processing + webhook security](../EP-007-ai-webhooks/index.md): processed texts и summaries. Читать, чтобы results UI не путал raw и processed поля.

## Progress report (evidence-based)
- `as_of`: 2026-03-06
- `total_features`: 3
- `completed_features`: 0
- `evidence_confirmed_features`: 0
- verification link:
  - [Verification matrix](../../verification-matrix.md): execution evidence для будущих results UX фич. Читать, чтобы acceptance закрывал и визуализацию, и privacy behavior.

## Definition of done
- Employee получает понятный личный dashboard без raw text.
- Manager видит только разрешённые team results с корректной анонимностью.
- HR получает расширенный workbench с processed/raw diagnostics, но без обхода existing permissions.
