# CLI spec (draft)
Status: Draft (2026-03-03)

Принципы:
- Каждая команда поддерживает human output и `--json`.
- Ошибки машиночитаемы (code + message + details).
- CLI содержит развитую систему справки по командам и примеры использования (AI-friendly).
- CLI — тонкий клиент поверх typed client API (не содержит доменных правил).

Ссылки (аннотированные):
- [Client API](../client-api/index.md): typed contract + typed client и правила операций/ошибок/контекста компании. Читать, чтобы CLI и UI использовали один и тот же контракт и не расходились по поведению.

Команды (первый контур, MVP):
- `ping [--json]`
- `seed --scenario <name> [--variant <name>] [--json]`
- `company create ...`
- `company use <company_id>`
- `employee upsert ...`
- `org department create|move ...`
- `org set-manager ...`
- `model version create --kind indicators|levels ...`
- `campaign create ...`
- `campaign set-model <campaign_id> <model_version_id>`
- `campaign participants add|remove ...`
- `campaign participants add-departments <campaign_id> --from-departments ...`
- `campaign weights set ...`
- `campaign start <campaign_id>`
- `campaign stop <campaign_id>`
- `campaign end <campaign_id>` (manual helper)
- `campaign progress <campaign_id>`
- `matrix generate <campaign_id> --from-departments ...`
- `matrix set <campaign_id> ...`
- `questionnaire list ...`
- `questionnaire save-draft ...`
- `questionnaire submit ...`
- `results my|team|hr ...`
- `notifications dispatch`
- `reminders generate`
- `ai run <campaign_id>`

SSoT маппинга “команда → операция”: [Command catalog](command-catalog.md) — 1:1 соответствие CLI и typed client API. Читать, чтобы не “размазывать” одну команду по нескольким операциям и чтобы тесты повторяли поведение UI.
