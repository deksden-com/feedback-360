---
description: FT-0082-questionnaire-ui feature plan and evidence entry for EP-008-ui-minimal.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-008-ui-minimal/index.md
epic: EP-008
feature: FT-0082
---


# FT-0082 — Questionnaire UI (list/fill/draft/submit)
Status: Completed (2026-03-05)

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
- [Stitch design refs for FT-0082](../../../../../spec/ui/design-references-stitch.md#ft-0082-questionnaire-ui): экраны списка задач и формы анкеты как agreed visual reference. Читать, чтобы ускорить UI реализацию без потери доменных правил.

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
- При фиксации evidence: для UI шагов добавлять скриншоты и вставлять их в markdown как изображения (`![...](...)`).

## Manual verification (deployed environment)
### Beta scenario A — draft/save/submit
- Environment:
  - URL: `https://beta.go360go.ru`
- Preconditions:
  - есть сотрудник `employee` с доступом к компании и назначенной анкетой в кампании `started`;
  - анкета в статусе `not_started` или `in_progress`;
  - пользователь может войти по magic link.
- Steps:
  1) Войти на `https://beta.go360go.ru/auth/login` через magic link.
  2) На `select-company` выбрать компанию с активной кампанией.
  3) Открыть экран `My questionnaires`.
  4) Открыть анкету, заполнить часть полей, нажать `Сохранить черновик`.
  5) Проверить, что после рефреша данные черновика сохранились.
  6) Дозаполнить анкету и нажать `Отправить`.
  7) Вернуться в список анкет.
- Expected:
  - в шаге 3 видна назначенная анкета;
  - в шаге 4/5 данные сохраняются без потерь;
  - в шаге 6 submit проходит без ошибки;
  - в шаге 7 статус анкеты = `submitted` (или эквивалентный UI-статус “Отправлено”).

### Beta scenario B — read-only после ended
- Preconditions:
  - есть кампания в статусе `ended` и анкета сотрудника, которая ранее была `in_progress` или доступна к просмотру.
- Steps:
  1) Войти под тем же сотрудником.
  2) Открыть соответствующую анкету.
  3) Попробовать изменить ответ и сохранить.
- Expected:
  - UI показывает read-only состояние;
  - сохранение/submit блокируется;
  - если UI инициирует запрос, backend возвращает доменную ошибку `campaign_ended_readonly`, а UI отображает корректное сообщение.

## Design references (stitch)
- [`stitch_go360go/_1/screen.png`](../../../../../../stitch_go360go/_1/screen.png): список “Мои задачи/анкеты” со статусными фильтрами. Используем как референс информационной структуры списка.
- [`stitch_go360go/employee_feedback_questionnaire/screen.png`](../../../../../../stitch_go360go/employee_feedback_questionnaire/screen.png): форма оценки с прогрессом и секциями компетенций. Используем как референс layout анкеты.

## Design constraints (what we do NOT take)
- Не переносим поведение, которое конфликтует с read-only после `ended` и freeze-правилами.
- Не копируем демо-тексты/данные и любые action-кнопки, которых нет в нашем typed API.

## Progress note (2026-03-05)
- Выполнен вертикальный слайс FT-0082:
  - contract/core/client: добавлена операция `questionnaire.getDraft`, `questionnaire.listAssigned` теперь поддерживает список без `campaignId`, а rater-scoping enforced по `userId -> employee`.
  - web UI: добавлены страницы `/questionnaires` и `/questionnaires/[questionnaireId]`.
  - web API: добавлены route handlers `/api/questionnaires/draft` и `/api/questionnaires/submit`.
  - security: manager/employee получают только свои анкеты (list/get/save/submit).

## Regression refresh (2026-03-06)
- FT-0082 сохранён как базовый questionnaire slice, но теперь опирается на richer structured questionnaire form:
  - indicators/levels рендерятся из resolved questionnaire definition;
  - save draft / submit routes принимают structured form payload;
  - acceptance path обновлён и остаётся зелёным как regression для EP-013.

## Quality checks evidence (2026-03-05)
- `pnpm --filter @feedback-360/api-contract lint && pnpm --filter @feedback-360/api-contract typecheck` → passed.
- `pnpm --filter @feedback-360/db lint && pnpm --filter @feedback-360/db typecheck` → passed.
- `pnpm --filter @feedback-360/core lint && pnpm --filter @feedback-360/core typecheck` → passed.
- `pnpm --filter @feedback-360/client lint && pnpm --filter @feedback-360/client typecheck` → passed.
- `pnpm --filter @feedback-360/web lint && pnpm --filter @feedback-360/web typecheck` → passed.
- `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0013-questionnaires.test.ts src/ft/ft-0082-questionnaire-access.test.ts --fileParallelism=false` → passed.
- `pnpm --filter @feedback-360/client exec vitest run src/ft-0082-questionnaire-get-draft-client.test.ts` → passed.
- `set -a; source .env; set +a; pnpm --filter @feedback-360/web test` → passed.

## Acceptance evidence (2026-03-06)
- `PLAYWRIGHT_BASE_URL=http://localhost:3111 cd apps/web && node ../../node_modules/@playwright/test/cli.js test --config playwright/playwright.config.mjs tests/ft-0082-questionnaire-ui.spec.ts --workers=1 --reporter=line` → passed.
- Covered acceptance:
  - `S5_campaign_started_no_answers`: questionnaire inbox → structured draft save → submit → status `submitted`.
  - `S8_campaign_ended`: UI read-only + backend `campaign_ended_readonly` на попытке save.
- Artifacts:
  - step-01: questionnaire inbox.
    ![step-01-questionnaire-inbox](../../../../../evidence/EP-008/FT-0082/2026-03-06/step-01-questionnaire-inbox.png)
  - step-02: structured draft saved.
    ![step-02-questionnaire-draft-saved](../../../../../evidence/EP-008/FT-0082/2026-03-06/step-02-questionnaire-draft-saved.png)
  - step-03: questionnaire submitted.
    ![step-03-questionnaire-submitted](../../../../../evidence/EP-008/FT-0082/2026-03-06/step-03-questionnaire-submitted.png)
  - step-04: `ended` campaign in read-only.
    ![step-04-ended-readonly-view](../../../../../evidence/EP-008/FT-0082/2026-03-06/step-04-ended-readonly-view.png)
