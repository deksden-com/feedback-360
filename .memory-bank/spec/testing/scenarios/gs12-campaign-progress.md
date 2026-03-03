# GS12 — Campaign progress (HR) (planned)
Status: Draft (2026-03-03)

## Setup
- Seed: `S7_campaign_started_some_submitted`

## Action
1) HR вызывает `campaign.progress.get` по кампании.

## Assertions
- В ответе есть:
  - счётчики по статусам анкет (not_started/in_progress/submitted),
  - список “не закончил” (pending questionnaires или pending raters).
- RBAC: employee/manager не могут получить HR progress (typed `forbidden`).

## Client API ops (v1)
- `campaign.progress.get`

## CLI example
- `campaign progress <campaign_id> --json` под ролью `hr_admin`.

