# Roadmap (epics order)
Status: Draft (2026-03-03)

Принцип: вертикальные слайсы (contract + core + cli + tests), UI добавляем поверх “уже работающего” ядра.

Порядок (MVP):
1) Foundation: repo/workspace, DB, migrations, seed scenarios, CI basics.
2) Core + typed contract + client + CLI (smoke сценарии без UI).
3) Tenancy + RBAC + Auth linking (user/employee/memberships).
4) Org structure + snapshots.
5) Competency models (versions, indicators first).
6) Campaign lifecycle + assignments + freeze rule.
7) Questionnaires (draft/save/submit) + progress tracking.
8) Aggregation + anonymity + weights normalization.
9) Notifications (email-only) + outbox + cron scheduling.
10) AI processing + webhook security + retry.
11) Minimal UI (HR flow + employee flow) + Playwright golden e2e.

