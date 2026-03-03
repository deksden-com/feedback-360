# FT-0082 — Questionnaire UI (list/fill/draft/submit)
Status: Draft (2026-03-03)

## User value
Сотрудник видит свои анкеты, может сохранять черновики и отправлять.

## Deliverables
- Экран “My questionnaires” (calls `questionnaire.listAssigned`).
- Экран заполнения (calls `questionnaire.saveDraft` / `questionnaire.submit`).

## Context (SSoT links)
- [Questionnaires](../../../../../spec/domain/questionnaires.md): инварианты draft/save/submit. Читать, чтобы UI не делал “свою” валидацию, расходящуюся с core.
- [CLI-first principle](../../../../../spec/project/layers-and-vertical-slices.md): UI тонкий поверх typed client. Читать, чтобы UI повторял CLI/ops, а не добавлял логику.
- [Architecture guardrails](../../../../../spec/engineering/architecture-guardrails.md): запреты на импорт core в UI. Читать, чтобы все правила оставались в core.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): как связываем UI с ops и тестами. Читать, чтобы e2e покрывал сквозной сценарий.

## Acceptance (auto, Playwright)
### Setup
- Seed: `S5_campaign_started_no_answers`

### Action
1) Открыть список анкет.
2) Открыть анкету → сохранить draft.
3) Submit.

### Assert
- Draft сохранён; submit финализирует.
- После `ended` UI становится read-only, а backend возвращает доменную ошибку на save/submit (см. FT-0045).

## Implementation plan (target repo)
- Screens:
  - “My questionnaires” — таблица/список с фильтрами статуса, данные только из `questionnaire.listAssigned`.
  - “Fill questionnaire” — форма, которая:
    - сохраняет draft (можно автосейв), вызывает `questionnaire.saveDraft`,
    - submit вызывает `questionnaire.submit`.
- UI logic constraints:
  - UI не вычисляет lock/ended/immutability — только читает typed ответы/ошибки и отображает.
  - При ошибке `campaign_ended_readonly` UI переводит в read-only режим.

## Tests
- Playwright: открыть список → открыть анкету → save draft → submit.
- Playwright: на `S8_campaign_ended` (или сценарий ended) убедиться, что UI read-only и получает доменную ошибку при попытке сохранить.

## Memory bank updates
- Если добавляем новые UI состояния/ошибки — обновить: [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md) — SSoT. Читать, чтобы flows оставались едиными.

## Verification (must)
- Automated test: Playwright сценарий заполнения анкеты (list → draft → submit) + проверка read-only после ended.
- Must run: Playwright e2e (часть GS1) + ended кейс (можно отдельным e2e, минимально).
