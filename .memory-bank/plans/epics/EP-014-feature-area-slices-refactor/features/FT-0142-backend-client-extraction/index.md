# FT-0142 — Core/contract/client/cli extraction by feature areas
Status: Completed (2026-03-06)

## Traceability (mandatory)
- Epic: [EP-014 — Feature-area slice refactor](../../index.md)
- PR: должен ссылаться на этот FT-документ и на execution evidence в [Verification matrix](../../../../verification-matrix.md).
- Commits/branch: следовать `[FT-0142]` / `[EP-014]` и правилам из [Git flow](../../../../../spec/operations/git-flow.md).

## User value
Изменения в backend/API/automation становятся локальнее: разработчик быстрее находит owning код фичи и реже ломает соседние области при работе над campaigns, questionnaires, results, notifications или AI.

## Deliverables
- Перенос `api-contract` из общего `index.ts` в versioned slice modules по feature areas.
- Перенос `core` из перегруженного root dispatcher в slice-oriented modules с thin composition layer.
- Перенос `client` в feature-area modules и выведение `cli` в thin entrypoint + transitional legacy registry без изменения существующего контракта и поведения.
- Добавление/обновление architecture smoke tests на import boundaries, representative operations и regression coverage.
- Legacy paths либо удалены, либо сведены к thin re-export shim с явным планом удаления.

## Context (SSoT links)
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): каноничный список операций. Читать, чтобы refactor не поменял surface area API.
- [CLI command catalog](../../../../../spec/cli/command-catalog.md): 1:1 mapping `command → operation`. Читать, чтобы command grouping не привёл к скрытой логике.
- [Architecture guardrails](../../../../../spec/engineering/architecture-guardrails.md): границы импортов и clients/core discipline.
- [Repo structure (target)](../../../../../spec/project/repo-structure.md): target paths для slices.
- [Testing standards](../../../../../spec/engineering/testing-standards.md): что должно остаться зелёным во время refactor.
- [Verification matrix](../../../../verification-matrix.md): обязательные regression checks по уже реализованным FT.

## Project grounding (mandatory before coding)
- [ ] Прочитан FT-0141 и зафиксирован approved target map.
- [ ] Прочитаны operation catalog, CLI command catalog и verification matrix.
- [ ] Снят inventory текущих root dispatchers / giant indexes / command registries.
- [ ] Выделены representative regression flows по feature areas: campaigns, questionnaires, results, notifications, ai.
- [ ] Определён порядок переноса, который позволяет держать workspace зелёным после каждого mergeable шага.

## Implementation plan
- `api-contract`:
  - разложить операции, DTO и parsers по `v1/<feature-area>/...`;
  - оставить thin public entrypoint для aggregate exports.
- `core`:
  - вынести operation handlers и local policies из перегруженного root файла в `slices/<feature-area>/...`;
  - оставить в root только dispatch composition и truly shared helpers.
- `client`:
  - сгруппировать методы по feature areas;
  - сохранить transport parity и active-company context behavior.
- `cli`:
  - разложить команды по `commands/<feature-area>/...`;
  - не допустить появления business logic inside commanders/formatters.
- Добавить regression tests на representative operations до и после переноса.

## Scenarios (auto acceptance)
### Setup
- Existing implemented seeds and regression tests from EP-004..EP-013.
- Representative actors: `hr_admin`, `employee`, `manager`.

### Action
1. Прогнать representative operation flows для campaigns, questionnaires, results, notifications и ai.
2. Перенести код в feature-area structure.
3. Повторно прогнать те же flows и package-level tests.

### Assert
- Public operation names, DTO shapes, CLI command behavior и error codes не изменились.
- Root entrypoints стали thin composition points, а основная логика живёт внутри feature areas.
- Нет новых cross-area import cycles и нет доменной логики внутри client/cli glue.

### Client API ops (v1)
- `campaign.*`
- `questionnaire.*`
- `results.*`
- `notifications.*`
- `ai.runForCampaign`
- supporting ops from `membership`, `employee`, `org`, `matrix`, `model`.

## Manual verification (deployed environment)
- Environment:
  - URL: `https://beta.go360go.ru`
  - Build/commit: `<sha / deployment url>`
  - Date: `YYYY-MM-DD`
- Preconditions:
  - beta environment updated to refactor branch;
  - test accounts for `hr_admin`, `employee`, `manager`;
  - campaign data for HR campaigns, questionnaires and results already present.
- Steps (start → finish):
  1. HR opens campaign list and campaign detail.
  2. Employee opens questionnaire inbox, resumes draft and submits.
  3. Employee and manager open results surfaces that already existed before refactor.
- Expected result per step:
  - `step-1`: campaign surfaces work without route/server errors.
  - `step-2`: draft/save/submit behavior unchanged.
  - `step-3`: results load with pre-existing visibility rules intact.
- Tooling:
  - browser-check via `$agent-browser`.
- Notes:
  - this verification proves runtime parity after internal structural change.

## Tests
- Unit/integration: existing package suites for affected feature areas.
- Contract: DTO parser/operation regression for moved modules.
- CLI: existing FT CLI suites for representative ops.
- Architecture smoke: import-boundary / slice-layout checks.

## Docs updates (SSoT)
- [Repo structure (target)](../../../../../spec/project/repo-structure.md)
- [Architecture guardrails](../../../../../spec/engineering/architecture-guardrails.md)
- [Implementation playbook](../../../../implementation-playbook.md)
- [CLI command catalog](../../../../../spec/cli/command-catalog.md)
- [Client API operation catalog](../../../../../spec/client-api/operation-catalog.md)

## Quality checks evidence (after implementation)
- Date: `2026-03-06`
- Checks run:
  - `pnpm checks`
  - `pnpm --filter @feedback-360/api-contract test`
  - `pnpm --filter @feedback-360/client test`
  - `pnpm --filter @feedback-360/cli test`
- Result: passed.

## Acceptance evidence (after implementation)
- Date: `2026-03-06`
- Commands/tests run:
  - `pnpm checks`
  - `pnpm --filter @feedback-360/api-contract test`
  - `pnpm --filter @feedback-360/client test`
  - `pnpm --filter @feedback-360/cli test`
  - `pnpm --filter @feedback-360/core test -- --runInBand src/ft/ft-0142-feature-layout-no-db.test.ts`
- Result: passed.
- If docs changed: `pnpm docs:audit`

## CI/CD evidence (mandatory for runtime/deploy/integration changes)
- GitHub:
  - CI run URL / check-runs URL
  - Status: planned
- Vercel:
  - Deployment URL
  - Status: planned
