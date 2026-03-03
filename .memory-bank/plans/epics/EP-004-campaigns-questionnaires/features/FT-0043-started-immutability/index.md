# FT-0043 — Started immutability (model + participants)
Status: Draft (2026-03-03)

## User value
После старта нельзя “подкручивать правила”: модель и состав участников фиксируются.

## Deliverables
- Ops: `campaign.setModelVersion`, `campaign.participants.add/remove`.
- Доменные запреты после `campaign.start`.

## Context (SSoT links)
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): immutability после start. Читать, чтобы запреты были на уровне core, а не “в UI”.
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): ops model/participants. Читать, чтобы CLI/UI делали одно и то же.
- [GS6 Started immutability](../../../../../spec/testing/scenarios/gs6-started-immutability.md): golden сценарий запретов. Читать, чтобы acceptance проверял отсутствие частичных изменений.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист. Читать, чтобы запреты были покрыты тестами.

## Acceptance (auto)
### Setup
- Seed: `S4_campaign_draft --json` → `handles.campaign.main`
- Actor: HR Admin

### Action (CLI, `--json`)
1) В draft:
  - `campaign set-model <handles.campaign.main> <model_version_id> --json`
  - `campaign participants add <handles.campaign.main> <employee_id> --json`
2) `campaign start <handles.campaign.main> --json`
3) После start повторить `campaign set-model` и `campaign participants add/remove`.

### Assert
- До start изменения разрешены.
- После start изменения модели и participants запрещены доменной typed ошибкой и без частичных изменений.

### Client API ops (v1)
- `campaign.setModelVersion`
- `campaign.participants.add`
- `campaign.participants.remove`
- `campaign.start`

## Implementation plan (target repo)
- Core:
  - В `campaign.setModelVersion` и `campaign.participants.*` добавить доменную проверку:
    - разрешено только при `status=draft`,
    - иначе typed error (например `campaign_started_immutable`).
  - Проверка должна быть транзакционной и без частичных изменений (не “успели добавить одного участника”).
- DB:
  - Убедиться, что `campaigns.status` индексируется (частые проверки).
- CLI/contract:
  - Зафиксировать error code в SSoT списке (см. `spec/client-api/errors.md`).

## Tests
- Integration (GS6): до start ops разрешены, после start — возвращают typed error и не меняют данные.

## Memory bank updates
- При выборе имени error code обновить: [Error model](../../../../../spec/client-api/errors.md) — SSoT коды. Читать, чтобы acceptance сценарии проверяли точный `code`.

## Verification (must)
- Automated test: `packages/core/test/ft/ft-0043-started-immutability.test.ts` (integration) повторяет GS6: до start можно, после start — typed error и no partial writes.
- Must run: GS6 должен быть зелёным.
