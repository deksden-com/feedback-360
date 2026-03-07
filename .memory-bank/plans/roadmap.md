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
12) Test & release hardening (DB integration isolation, CI checks, beta smoke gates, evidence sync).
13) Production readiness (retention/privacy, observability, runbook drill, release rehearsal).

Порядок (next GUI wave):
14) App shell + navigation + role-aware home dashboards.
15) HR campaigns UX (list/create/detail).
16) Questionnaire experience (inbox/fill/read-only).
17) Feature-area slice refactor (core/contract/client/cli/web realignment + docs sync + regression proof).
18) Results experience (employee/manager/HR dashboards).
19) People + org admin.
20) Competency models + matrix UI.
21) Notification center UI.
22) Admin + ops UI.
23) Cross-epic scenarios (XE) foundation.

Отложено после GUI wave:
- Реальная внешняя AI integration beyond current MVP stub.
- Telegram notifications / Telegram login / OAuth expansion.
