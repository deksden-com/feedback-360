# Feature template (vertical slice)
Status: Template

## Feature <FT-XXX-YY> — <Name>

### User value
Что меняется для пользователя (HR/Employee/Manager) и какой outcome.

### Deliverables
Что появится в системе:
- API operation(s) / contract changes
- Core use-case(s) / policy changes
- Data: tables/migrations/constraints (conceptual)
- CLI command(s) (human + `--json`)
- UI screen(s) (если входит в slice)

### Context (SSoT links)
Аннотированные ссылки на SSoT документы, которые нужны для реализации (domain/security/testing/engineering).

### Implementation plan
План реализации “по слоям” с целевыми путями (contract/core/db/cli/tests) и тонкими моментами.

### Scenarios (auto acceptance)
Минимум один сценарий в стандартном формате:

#### Setup
- Seed: `<Sx> --json` (использовать `handles`, не числовые id).
- Actors: какие роли/пользователи участвуют.

#### Action
- CLI (`--json`) и/или прямой вызов Client API operation(s).
- Шаги должны быть детерминированными: получать `id` только из `handles` или из `list/get` операций.

#### Assert
- Конкретные проверки:
  - статусы/поля,
  - запреты (RBAC/anonymity/freeze),
  - error codes (`code`) и отсутствие частичных изменений.

#### Client API ops (v1)
- Перечень операций, которые покрывает сценарий.

### Tests
- Unit: …
- Integration: …
- Contract: …
- E2E (если нужно): …

### Docs updates (SSoT)
Какие документы в `.memory-bank/spec/*` и `.memory-bank/adr/*` должны быть обновлены.
