# GS2 — Small group anonymity
Status: Active (2026-03-05)

## Setup
- Seed: `S7_campaign_started_some_submitted --variant peers2`
- Policy: `small_group_policy = hide` (default) и отдельный прогон для `merge_to_other`.

## Action
1) `results hr --campaign <id> --subject <id> --json` (default `small_group_policy=hide`).
2) `results hr --campaign <id> --subject <id> --small-group-policy merge_to_other --json`.

## Assertions
- `hide`: `groupVisibility.peers=subordinates=hidden`.
- `merge_to_other`: `groupVisibility.peers=subordinates=merged`, `groupVisibility.other=shown` (если merged `n>=3`).
- Per-competency threshold: для компетенции с `n_valid < 3` у merged группы `otherVisibility=hidden`.

## Client API ops (v1)
- `results.getMyDashboard` / `results.getTeamDashboard` / `results.getHrView` (в зависимости от роли)

## CLI example (optional)
- `results hr --campaign <campaign_id> --subject <employee_id> --json`
- `results hr --campaign <campaign_id> --subject <employee_id> --small-group-policy merge_to_other --json`
