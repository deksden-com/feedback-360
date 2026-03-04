# GS12 — Campaign progress (HR)
Status: Completed (2026-03-04)

## Setup
- Seed: `S7_campaign_started_some_submitted`

## Action
1) HR вызывает `campaign.progress.get` по кампании.

## Assertions
- В ответе есть:
  - счётчики по статусам анкет (not_started/in_progress/submitted),
  - список “не закончил” (pending questionnaires или pending raters).
- RBAC: employee/manager не могут получить HR progress (typed `forbidden`).

## Execution evidence (2026-03-04)
- `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0046-campaign-progress.test.ts` → passed.
- CLI acceptance:
  - `campaign progress <campaign_id> --json` под `hr_admin` → `notStarted=1`, `inProgress=1`, `submitted=1`, pending=2.
  - `campaign progress <campaign_id> --json` под `employee` → `forbidden`.

## Client API ops (v1)
- `campaign.progress.get`

## CLI example
- `campaign progress <campaign_id> --json` под ролью `hr_admin`.
