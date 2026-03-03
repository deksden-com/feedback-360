# FT-0033 — Matrix autogeneration (from selected departments)
Status: Draft (2026-03-03)

## User value
HR выбирает подразделения, а система предлагает матрицу оценщиков, корректно учитывая иерархию и peers между руководителями одного уровня.

## Deliverables
- Ops:
  - `campaign.participants.addFromDepartments` — включить сотрудников выбранных подразделений (с дочерними).
  - `matrix.generateSuggested --from-departments ...` — предложить назначения по direct-manager (из snapshot в started, из live org в draft).
- Suggested assignments (agreed rules):
  - `manager` = direct manager
  - `peers` = same manager (включая правило “руководители подразделений одного уровня — коллеги”)
  - `subordinates` = direct reports
  - `self` = optional (default on)

## Context (SSoT links)
- [Assignments & matrix](../../../../../spec/domain/assignments-and-matrix.md): agreed правила autogen и редактирования до lock. Читать, чтобы генератор соответствовал домену.
- [Org structure](../../../../../spec/domain/org-structure.md): direct-manager и дерево подразделений. Читать, чтобы “выбранное подразделение + дочерние” считалось одинаково везде.
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): draft/started и snapshot. Читать, чтобы понимать, когда читаем live org, а когда snapshot.
- [GS11 Matrix autogen](../../../../../spec/testing/scenarios/gs11-matrix-autogen.md): golden сценарий autogen. Читать, чтобы acceptance был сильным и проверял иерархию.
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): SSoT ops. Читать, чтобы новые ops были отражены и в CLI 1:1.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист реализации. Читать, чтобы фича прошла через contract/core/db/cli/tests.

## Acceptance (auto)
### Setup
Seed: `S4_campaign_draft --variant no_participants --json` → handles: `company.main`, `campaign.main`, `department.a`, `department.b`, `employee.head_a`, `employee.head_b`.

### Action (CLI, `--json`)
1) `company use <handles.company.main> --json`
2) `campaign participants add-departments <handles.campaign.main> --from-departments <handles.department.a> <handles.department.b> --json`
3) `matrix generate <handles.campaign.main> --from-departments <handles.department.a> <handles.department.b> --json`

### Assert
- `employee.head_a` и `employee.head_b` назначены peers друг другу (same upstream manager).
- Сотрудники department A получают manager=`employee.head_a`; department B → manager=`employee.head_b`.

### Client API ops (v1)
- `client.setActiveCompany` (client-local)
- `campaign.participants.addFromDepartments`
- `matrix.generateSuggested`

## Implementation plan (target repo)
- Contract:
  - Добавить op `campaign.participants.addFromDepartments` (input: `campaign_id`, `department_ids[]`, options) и описать deterministic output (например списки добавленных employees).
  - Уточнить input `matrix.generateSuggested` (берём `department_ids` как фильтр или читаем “выбранные” из campaign settings; на MVP проще принимать явно).
- Core:
  - `campaign.participants.addFromDepartments`: разворачивает дерево, находит employees, добавляет в participants (idempotent).
  - `matrix.generateSuggested`: строит suggestions по direct-manager отношениям:
    - в draft — по live org,
    - в started — по snapshot (если доступно и уместно).
  - Важно: один rater может быть peer для одного subject и manager для другого (разные строки назначения).
- DB:
  - Таблицы participants/assignments должны позволять:
    - избежать дублей (unique ключи),
    - хранить source (`auto`/`manual`) и роль оценщика.
- CLI:
  - Добавить команду `campaign participants add-departments` 1:1 к op.
  - `matrix generate` должен быть детерминированным по output при одинаковом input.

## Tests
- Integration (GS11): для выбранных подразделений autogen предлагает ожидаемые peers/manager связи.
- Integration: идемпотентность `addFromDepartments` (повторный вызов не создаёт дублей).

## Memory bank updates
- После добавления ops обновить:
  - [Operation catalog](../../../../../spec/client-api/operation-catalog.md): SSoT ops. Читать, чтобы CLI/UI не расходились.
  - [CLI command catalog](../../../../../spec/cli/command-catalog.md): 1:1 команды. Читать, чтобы acceptance сценарии были выполнимы через CLI.

## Verification (must)
- Automated test: `packages/core/test/ft/ft-0033-matrix-autogen.test.ts` (integration) повторяет Acceptance (add-departments + generate) и проверяет peers/manager правила.
- Must run: GS11 должен быть зелёным.
