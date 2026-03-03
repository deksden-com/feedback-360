# GS6 — Started immutability (model/participants) (planned)
Status: Draft (2026-03-03)

## Setup
- Seed: `S4_campaign_draft`

## Action
1) HR меняет model/participants в draft.
2) HR стартует кампанию.
3) HR пытается менять model/participants после start.

## Assertions
- Шаг 3 запрещён доменной ошибкой (`invalid_transition`/`campaign_started_immutable`) и без частичных изменений.

## Client API ops (v1)
- `campaign.setModelVersion`
- `campaign.participants.add`
- `campaign.participants.remove`
- `campaign.start`

## CLI example
1) `seed --scenario S4_campaign_draft --json` → `handles.campaign.main`
2) `campaign set-model <handles.campaign.main> <model_version_id>` (разрешено)
3) `campaign participants add <handles.campaign.main> <employee_id>` (разрешено)
4) `campaign start <handles.campaign.main>`
5) повтор 2–3 → ожидаем доменную ошибку (started immutable)
