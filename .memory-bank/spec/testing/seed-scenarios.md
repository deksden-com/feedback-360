# Seed scenarios (fixtures) — principles
Status: Draft (2026-03-03)

Цель: иметь “стандартные состояния БД”, относительно которых пишутся сценарии и автотесты.

## Principles
- Seed сценарий = именованный набор данных, который создаёт воспроизводимое состояние.
- Сценарии должны быть **детерминированными** и пригодными для автотестов.
- Тесты не должны хардкодить DB id; seed должен возвращать **мэппинг** (например, через CLI `--json`).

## How we “fix” seed data (contract)
- Каждый сценарий возвращает JSON вида:
  - `scenario`: имя сценария
  - `handles`: стабильные ключи → реальные id (и/или email), например `company.main`, `user.hr_admin`, `employee.ceo`, `campaign.main`.
- Любой тест ссылается только на `handles`, а не на “id = 1”.
- Сценарии могут **композироваться**: `S4_campaign_draft` может вызывать `S2_org_basic` и `S3_model_indicators`, чтобы не дублировать создание базовых данных.

## Variants (edge cases без “ручных апдейтов”)
Нам нужны детерминированные edge cases (peers=2, NA-heavy rater, levels tie, …). Для этого вводим механизм вариантов:
- `seed.run` принимает `scenario` и опционально `variant`.
- CLI: `seed --scenario <Sx> [--variant <name>] --json`.
- В seed-документе фиксируем варианты в разделе `## Variants` (что именно меняется и какие handles добавляются).

Почему так:
- Тесты не должны “допатчивать” БД руками (это ломает воспроизводимость).
- Варианты позволяют держать один базовый seed и несколько целевых edge cases.

## Implementation note (target)
В коде seed сценарии живут в `packages/db` и вызываются:
- напрямую из integration тестов,
- через CLI `seed --scenario <name> --json` для e2e и воспроизводимости.

## Recommended scenarios (starter set)
- `S0_empty`: пустая БД (после миграций).
- `S1_company_min`: 1 company + 1 HR admin (user+employee+membership).
- `S1_company_roles_min` (planned): 1 company + 4 роли (hr_admin, hr_reader, manager, employee) как users+employees+memberships, для RBAC тестов.
- `S1_multi_tenant_min`: 2 companies + 1 user в двух memberships (и соответствующие employee) + company-scoped campaigns/questionnaires, чтобы тестировать изоляцию и переключение компании.
- `S2_org_basic`: подразделения + сотрудники + руководитель + связи.
- `S3_model_indicators`: модель компетенций (indicators).
- `S3_model_levels` (planned): модель компетенций (levels 1..4 + UNSURE) для GS9.
- `S4_campaign_draft`: кампания в draft с участниками.
- `S5_campaign_started_no_answers`: started, матрица назначений, но без ответов.
- `S6_campaign_started_some_drafts`: есть draft save (кампания locked).
- `S7_campaign_started_some_submitted`: есть submit (для агрегаций/анонимности).
- `S8_campaign_ended`: ended.
- `S9_campaign_completed_with_ai`: completed, есть AI-processed агрегаты текста.

Подробное описание каждого seed: [Seed catalog](seeds/index.md) — какие данные создаются и какие handles возвращаются. Читать, чтобы тесты были детерминированными и не хардкодили id.
