# Feature template
Status: Draft (2026-03-03)

## <Feature name>
- **User value**: (в терминах пользователя)
- **Deliverable**: (что появится в системе: сущности/операции/команды/экраны)
- **Context (links)**: (SSoT ссылки на spec/стандарты + почему читать)
- **Implementation plan**: (по слоям: contract/core/db/cli/tests, с целевыми путями файлов)
- **Acceptance (auto)**:
  - Setup: seed `<Sx> --json` + нужные `handles` + actor roles
  - Action: детерминированные шаги (CLI `--json` / Client API ops)
  - Assert: статусы/поля/запреты + typed error codes + no partial writes
  - Ops: список Client API ops v1
- **Memory bank updates**: (какие SSoT документы нужно обновить по итогу реализации)

Notes:
- Ориентир по “как превращаем план в код”: [Implementation playbook](implementation-playbook.md) — чеклист “FT → код”. Читать, чтобы план был исполнимым и вертикальным.
