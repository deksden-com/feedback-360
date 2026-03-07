# EP-021 — UI traceability and SaaS polish
Status: In Progress (2026-03-07)

## Goal
Сделать интерфейс более зрелым и привычным для современного SaaS, **не теряя ни одной текущей функции**, и одновременно ввести жёсткую трассируемость UI через `screen_id`, `testIdScope`, `data-testid`, docs и screenshots.

## Scope
- In scope:
  - screen registry rollout;
  - `data-testid`/POM normalization;
  - app shell identity chrome and familiar account controls;
  - CRUD polish for employees/org;
  - content-first hierarchy for questionnaire/results surfaces.
- Out of scope:
  - новые доменные функции;
  - изменение правил ролей, анонимности, freeze, calculations;
  - AI/Telegram/notification logic changes.

## Features (vertical slices)
- [Feature catalog](features/index.md): FT-0211..FT-0215. Читать, чтобы проводить UI рефакторинг не хаотично, а по связанной серии проверяемых vertical slices.

## Dependencies
- [EP-011 App shell and navigation](../EP-011-app-shell-navigation/index.md): текущий shell/home baseline. Читать, чтобы улучшать shell, а не начинать его заново.
- [EP-012 HR campaigns UX](../EP-012-hr-campaigns-ux/index.md): portfolio/detail surfaces для HR. Читать, чтобы campaign polish не расходился с уже поставленной operational логикой.
- [EP-013 Questionnaire experience](../EP-013-questionnaire-experience/index.md): inbox/fill/read-only baseline. Читать, чтобы questionnaire polish строился поверх уже работающего user flow.
- [EP-015 Results experience](../EP-015-results-experience/index.md): results dashboards и privacy-safe surfaces. Читать, чтобы визуальный polish не нарушил results contract.
- [EP-016 People and org admin](../EP-016-people-org-admin/index.md): employees/org GUI baseline. Читать, чтобы CRUD polish и hierarchy improvements делались на верных routes.
- [EP-020 Cross-epic scenarios](../EP-020-cross-epic-scenarios/index.md): XE/browser automation baseline. Читать, чтобы screen-id/test-id rollout сразу улучшал traceability и automation, а не ломал её.

## Progress report (planned)
- `as_of`: 2026-03-07
- `total_features`: 5
- `completed_features`: 1
- `evidence_confirmed_features`: 1
- verification link:
  - [Verification matrix](../../verification-matrix.md): сюда будут записываться execution evidence по каждому UI polish slice. Читать, чтобы completion был подтверждён local + beta checks.

## Definition of done
- Ключевые route-level screens имеют канонический `screen_id`, `testIdScope`, predictable `data-testid` и traceability до guides/screenshots/evidence.
- Shell выглядит как familiar SaaS workspace: user identity, active company, user menu, grouped nav.
- Employees/org surfaces читаются как зрелые CRUD/hierarchy screens, а не как набор служебных блоков.
- Questionnaire/results surfaces показывают в первую очередь контент и status/progress, а не вспомогательные controls.
- Каждая FT подтверждена local acceptance, beta verification и обновлением memory-bank traceability.
