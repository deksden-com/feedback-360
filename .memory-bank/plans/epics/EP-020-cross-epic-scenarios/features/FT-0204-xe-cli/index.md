# FT-0204 — XE CLI
Status: Draft (2026-03-07)

Пользовательская ценность: AI-агент и разработчик управляют сценариями через единый CLI без ручной сборки вспомогательных команд.

Deliverables:
- `xe scenarios list/show`
- `xe runs create/start/run/status/resume/delete`
- `xe seeds apply/inspect`
- `xe assertions run`
- `xe artifacts dir/export`
- `xe lock status/release --force`
- `xe auth issue`
- `xe notifications list`

Acceptance scenario:
- `xe runs run XE-001 --json` создаёт run и начинает execution
- `xe runs status <run-id>` возвращает phase/status summary
- `xe artifacts dir <run-id>` возвращает путь workspace
- `xe runs delete <run-id>` очищает run
