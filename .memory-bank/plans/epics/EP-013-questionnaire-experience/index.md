# EP-013 — Questionnaire experience
Status: Completed (2026-03-06)

## Goal
Сделать заполнение анкет продуктовым и понятным: inbox, прогресс, структурированная форма, save/submit feedback и корректный read-only после submit/ended.

## Scope
- In scope: questionnaire inbox, structured fill flow, autosave/draft feedback, submit confirmations, read-only states.
- Out of scope: новые правила question model; домен остаётся в core и уже реализован.

## Features (vertical slices)
- [Feature catalog](features/index.md): FT-0131..FT-0133. Читать, чтобы строить UX вокруг уже работающих questionnaire operations, а не изобретать новый поток.

## Dependencies
- [EP-004 Models + campaigns + questionnaires](../EP-004-campaigns-questionnaires/index.md): save/submit/read-only semantics. Читать, чтобы не сломать freeze и ended rules.
- [EP-008 Minimal UI](../EP-008-ui-minimal/index.md): текущий MVP slice анкет. Читать, чтобы развивать существующий поток, а не переписывать его вслепую.

## Progress report (evidence-based)
- `as_of`: 2026-03-06
- `total_features`: 3
- `completed_features`: 3
- `evidence_confirmed_features`: 3
- verification link:
  - [Verification matrix](../../verification-matrix.md): сюда пойдут acceptance и GS evidence для questionnaire UX. Читать, чтобы сценарии были воспроизводимы.

## Definition of done
- Employee/manager/rater могут пройти путь “найти анкету → заполнить → сохранить → отправить → открыть read-only”.
- Для каждого шага есть local acceptance и beta verification с артефактами.
- UI остаётся thin и не дублирует доменную валидацию анкеты.

## Current status
- Closed:
  - [FT-0131 Questionnaire inbox](features/FT-0131-questionnaire-inbox/index.md): inbox со status counters, фильтрами и resume-draft flow реализован и подтверждён Playwright evidence.
  - [FT-0132 Structured questionnaire fill flow](features/FT-0132-questionnaire-fill-flow/index.md): structured form, draft restore/save и submit flow реализованы и подтверждены локальным acceptance.
  - [FT-0133 Read-only and re-entry states](features/FT-0133-questionnaire-readonly/index.md): submitted/ended read-only режимы и backend conflict handling реализованы и подтверждены локальным acceptance.

## Completion note (2026-03-06)
- EP-013 закрыт полностью:
  - questionnaire list enriched campaign/subject/rater metadata и работает как inbox для resume flow;
  - questionnaire detail page рендерит structured definition из model version и показывает progress/read-only states без переноса логики в UI;
  - API contract, DB reads, CLI и seeds синхронизированы, чтобы local/beta acceptance были воспроизводимыми.
  - beta release gate подтверждён: smoke suite на `https://beta.go360go.ru` проходит после переноса seeding в runner и изоляции browser sessions для role-specific маршрутов.
