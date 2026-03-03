# FT-0041 — Competency models v1 (versioning + indicators)
Status: Draft (2026-03-03)

## User value
HR может создать модель компетенций, а кампания фиксирует ссылку на её версию.

## Deliverables
- Таблицы/сущности: model versions, competencies, indicators.
- Op: `model.version.create`.
- Валидации: шкала 1..5 + NA; порядок индикаторов.

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
- Submit анкеты запрещает невалидные значения (score вне 1..5 и “неправильный” NA).

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
- Automated test: `packages/core/test/ft/ft-0041-models.test.ts` (integration) создаёт модель, создаёт кампанию на ней и проверяет базовые валидации шкалы.
- Must run: `pnpm -r test` и smoke через CLI `model version create --json` (если CLI уже подключён).
