# FT-0133 — Read-only and re-entry states
Status: Planned (2026-03-06)

## User value
После submit или ended campaign пользователь не сомневается, можно ли ещё что-то менять, и понимает, куда идти дальше.

## Deliverables
- Read-only questionnaire view.
- Submitted/ended banners and disabled controls.
- Back-to-inbox/results actions.

## Context (SSoT links)
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): `ended` read-only semantics. Читать, чтобы banners and disabled controls были точными.
- [Questionnaires](../../../../../spec/domain/questionnaires.md): immutable after submit behavior. Читать, чтобы UI правильно различал submitted vs ended.
- [Stitch mapping — EP-013](../../../../../spec/ui/design-references-stitch.md#ep-013--questionnaire-experience): layout source, к которому добавляем explicit read-only affordances.

## Project grounding
- Прочитать FT-0045 и FT-0082 evidence.
- Проверить все server error codes around readonly/ended.

## Implementation plan
- Вынести read-only presentation state.
- Добавить clear reason messages and return paths.
- Обработать direct-link reopen cases.

## Scenarios (auto acceptance)
### Setup
- Seed: `S7_campaign_started_some_submitted`, `S8_campaign_ended`.

### Action
1. Открыть submitted questionnaire.
2. Открыть ended questionnaire.
3. Попробовать изменить answer.

### Assert
- Inputs read-only.
- Friendly banner shown.
- Backend readonly errors correctly surfaced.

### Client API ops (v1)
- Questionnaire loaders + readonly error handling.

## Manual verification (deployed environment)
- `beta`: открыть уже submitted and ended questionnaires; убедиться, что edit path закрыт.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
