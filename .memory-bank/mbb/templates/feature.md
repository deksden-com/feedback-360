# Feature template (vertical slice)
Status: Template

## Feature <FT-XXX-YY> — <Name>

### Traceability (mandatory)
- Epic: `EP-XXX` + ссылка на epic doc в `.memory-bank/plans/epics/*`.
- PR: ссылка на этот FT-документ + ссылка на evidence в [Verification matrix](../../plans/verification-matrix.md).
- Commits/branch: следовать правилам `[FT-*]/[EP-*]` и именования веток из [Git flow](../../spec/operations/git-flow.md).

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

### Project grounding (mandatory before coding)
Перед реализацией фичи агент фиксирует минимальный контекст, который он обязан прочитать:
- [ ] FT-документ фичи целиком (value/deliverables/scenario/tests/docs updates).
- [ ] Связанные SSoT документы из `Context (SSoT links)`.
- [ ] [Operation catalog](../../spec/client-api/operation-catalog.md) — нормативный список операций и ролей. Читать, чтобы не добавлять “скрытые” ops/обходы.
- [ ] [CLI command catalog](../../spec/cli/command-catalog.md) — каноничный mapping `command → operation`. Читать, чтобы CLI оставался тонким.
- [ ] [Traceability](../../spec/testing/traceability.md) + seed doc для выбранного сценария — карта `инвариант → тест → seed`. Читать, чтобы acceptance был воспроизводимым.
- [ ] Затрагиваемые слои/файлы по [Repo structure](../../spec/project/repo-structure.md) и [Architecture guardrails](../../spec/engineering/architecture-guardrails.md) — границы модулей и импортов. Читать, чтобы не нарушить архитектуру слоёв.

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

### Quality checks evidence (after implementation)
- Date: `YYYY-MM-DD`
- Checks run:
  - `pnpm -r lint`
  - `pnpm -r typecheck`
  - `pnpm -r test`
  - `build` (если применимо)
- Result: passed/failed + краткий комментарий (что именно проверялось).

### Acceptance evidence (after implementation)
- Date: `YYYY-MM-DD`
- Commands/tests run: …
- Result: …
- Artifacts (optional): скриншоты/логи/ссылки на CI run; если есть скриншоты — что именно подтверждает каждый.

### CI/CD evidence (mandatory for runtime/deploy/integration changes)
- GitHub:
  - CI run URL / commit check-runs URL
  - Status: `success|failed`
- Vercel:
  - Deployment URL (`preview|beta|prod`)
  - Status: `Ready|Error`
- If failed before fix:
  - Root cause (1-2 строки)
  - Link to successful rerun/redeploy
