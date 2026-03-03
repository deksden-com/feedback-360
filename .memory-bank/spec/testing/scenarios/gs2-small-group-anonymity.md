# GS2 — Small group anonymity
Status: Draft (2026-03-03)

## Setup
- Seed: `S7_campaign_started_some_submitted --variant peers2`
- Policy: `small_group_policy = hide` (default) и отдельный прогон для `merge_to_other`.

## Action
1) Compute/view results for subject.

## Assertions
- peers блок скрыт (hide) или слит в `other` (merge), согласно policy.
- Вес peers перераспределён по правилам нормализации.
- Open text peers не показывается при `n_valid < 3`.

## Client API ops (v1)
- `results.getMyDashboard` / `results.getTeamDashboard` / `results.getHrView` (в зависимости от роли)

## CLI example (optional)
- `results my` / `results team` / `results hr` — выбрать в зависимости от роли, ожидая корректное скрытие/слияние группы и пересчёт весов.
