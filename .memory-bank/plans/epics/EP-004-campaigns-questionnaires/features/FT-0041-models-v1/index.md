---
description: FT-0041-models-v1 feature plan and evidence entry for EP-004-campaigns-questionnaires.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-004-campaigns-questionnaires/index.md
epic: EP-004
feature: FT-0041
---


# FT-0041 — Competency models v1 (versioning + indicators)
Status: Completed (2026-03-04)

## User value
HR может создать модель компетенций, а кампания фиксирует ссылку на её версию.

## Deliverables
- Таблицы/сущности: model versions, competencies, indicators.
- Op: `model.version.create` + `campaign.create`.
- Валидации: `kind`, сумма весов групп=100, обязательность indicator/level payload по типу модели.

## Context (SSoT links)
- [Competency models](../../../../../spec/domain/competency-models.md): versioning и структура моделей (groups/competencies/indicators/levels skeleton). Читать, чтобы таблицы и DTO соответствовали домену.
- [Calculations](../../../../../spec/domain/calculations.md): шкалы 1..5 + NA и правила агрегаций. Читать, чтобы валидация ответов и NA семантика были согласованы.
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): ops `model.version.create` и `campaign.create`. Читать, чтобы CLI/UI вызывали одну и ту же операцию.
- [CLI command catalog](../../../../../spec/cli/command-catalog.md): 1:1 команда → op. Читать, чтобы CLI не “умнел” и не добавлял правил.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист реализации. Читать, чтобы фича была вертикальным слайсом (contract/core/db/cli/tests).

## Acceptance (auto)
### Setup
- Seed: `S1_company_min --json` → `handles.company.main`
- Actor: HR Admin

### Action (CLI, `--json`)
1) `company use <handles.company.main>`
2) `model version create --kind indicators ... --json` → взять `model_version_id`
3) `campaign create --model-version <model_version_id> ... --json`

### Assert
- Создана версия модели и она может использоваться кампанией.
- Некорректная модель (например, сумма весов групп ≠ 100) отвергается typed ошибкой `invalid_input`.

### Client API ops (v1)
- `client.setActiveCompany` (client-local)
- `model.version.create`
- `campaign.create`

## Implementation plan (target repo)
- DB:
  - Таблицы для версий моделей и содержимого:
    - `competency_model_versions` (kind=indicators|levels, version, status)
    - `competency_groups` (weight)
    - `competencies`
    - `competency_indicators` (order, текст)
  - (Skeleton) зарезервировать место под `competency_levels` для EP-005/GS9.
- Core:
  - `model.version.create` валидирует:
    - kind,
    - веса групп (если задаются),
    - корректность индикаторов (не пустые, упорядочиваемые).
- Contract/CLI:
  - DTO для создания версии (минимальный, без UI-сложностей).
  - CLI команда возвращает id версии и summary (human) / структуру (json).
- Тонкие моменты:
  - Кампания должна ссылаться на `model_version_id` и после start модель менять нельзя (см. FT-0043).

## Tests
- Unit: валидация модели (kind/weights/indicators order).
- Integration: создание версии → создание кампании, ссылающейся на неё.

## Memory bank updates
- Если меняется структура модели — обновить: [Competency models](../../../../../spec/domain/competency-models.md) — SSoT домена. Читать, чтобы кампании/анкеты/результаты читали одинаковую структуру.

## Verification (must)
- Automated tests:
  - `packages/core/src/ft/ft-0041-models-no-db.test.ts`
  - `packages/core/src/ft/ft-0041-models.test.ts`
  - `packages/client/src/ft-0041-model-campaign-client.test.ts`
  - `packages/cli/src/ft-0041-model-campaign-cli.test.ts`
- Must run: `pnpm -r test` и smoke через CLI `model version create --json` (если CLI уже подключён).

## Project grounding (2026-03-04)
- [Competency models](../../../../../spec/domain/competency-models.md): структура моделей (`versions/groups/competencies/indicators/levels`) и versioning-инварианты.
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): операции `model.version.create` и `campaign.create`, роли и CLI 1:1 маппинг.
- [CLI command catalog](../../../../../spec/cli/command-catalog.md): требования к human/`--json` формату и отсутствию бизнес-логики в CLI.
- [Seed scenarios](../../../../../spec/testing/seeds/s1-company-min.md): baseline окружение для acceptance через `S1_company_min`.

## Quality checks evidence (2026-03-04)
- `pnpm -r lint` → passed.
- `pnpm -r typecheck` → passed.
- `pnpm -r test` → passed.
- Build: N/A (изменения в packages/core/db/client/cli без нового build-gate).

## Acceptance evidence (2026-03-04)
- `pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0041-models-no-db.test.ts src/ft/ft-0041-models.test.ts` → passed (`integration subtests skipped` без `SUPABASE_DB_POOLER_URL`/`DATABASE_URL`).
- `pnpm --filter @feedback-360/client exec vitest run src/ft-0041-model-campaign-client.test.ts` → passed.
- `pnpm --filter @feedback-360/cli exec vitest run src/ft-0041-model-campaign-cli.test.ts` → passed.
- Проверено по intent: HR Admin создаёт версию модели, создаёт `draft` кампанию по `model_version_id`; невалидные веса модели дают `invalid_input`.
