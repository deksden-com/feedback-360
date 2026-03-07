# FT-0201 — XE run lifecycle and cleanup
Status: Draft (2026-03-07)

Пользовательская ценность: инженер или AI-агент может создать, запустить, исследовать и удалить изолированный сценарный run без ручной чистки БД и файловых артефактов.

Deliverables:
- `xe_runs` registry
- workspace provisioning `.xe-runs/...`
- no-concurrency guard for `beta`
- TTL / expired policy
- CLI delete/cleanup operations

Acceptance scenario:
- создать run `XE-001`
- убедиться, что создан registry entry и workspace
- попытка создать второй активный run на `beta` отклоняется
- `xe runs delete <run-id>` удаляет workspace и DB-следы run-а
- `xe runs delete --expired` очищает истёкшие run-ы
