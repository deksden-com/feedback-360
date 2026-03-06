# EP-013 — Questionnaire experience
Status: Planned (2026-03-06)

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
- `completed_features`: 0
- `evidence_confirmed_features`: 0
- verification link:
  - [Verification matrix](../../verification-matrix.md): сюда пойдут acceptance и GS evidence для questionnaire UX. Читать, чтобы сценарии были воспроизводимы.

## Definition of done
- Employee/manager/rater могут пройти путь “найти анкету → заполнить → сохранить → отправить → открыть read-only”.
- Для каждого шага есть local acceptance и beta verification с артефактами.
- UI остаётся thin и не дублирует доменную валидацию анкеты.
