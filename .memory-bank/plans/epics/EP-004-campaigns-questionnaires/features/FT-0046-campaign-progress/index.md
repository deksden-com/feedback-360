# FT-0046 — Campaign progress view (HR)
Status: Draft (2026-03-03)

## User value
HR видит ход кампании: кто начал/сохранил черновик/отправил анкеты, и кому нужны напоминания.

## Deliverables
- Op `campaign.progress.get` (HR view): отдаёт по кампании:
  - агрегаты по статусам анкет (not_started / in_progress / submitted),
  - список “кто не закончил” (по raters и/или по subjects),
  - timestamps (first_draft_at, submitted_at) где применимо.
- CLI: `campaign progress <campaign_id> --json` (AI-friendly).

## Context (SSoT links)
- [Questionnaires](../../../../../spec/domain/questionnaires.md): статусы анкет и что считается “прогрессом”. Читать, чтобы не считать черновик как submit и наоборот.
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): lock semantics и ended. Читать, чтобы прогресс корректно отражал “lock наступил” и “после ended read-only”.
- [RBAC spec](../../../../../spec/security/rbac.md): кто может видеть HR прогресс (hr_*). Читать, чтобы progress не открылся сотрудникам/менеджерам.
- [Operation catalog](../../../../../spec/client-api/operation-catalog.md): SSoT ops и roles. Читать, чтобы добавить `campaign.progress.get` как официальную операцию.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист. Читать, чтобы op был реализован в core и покрыт тестом.

## Acceptance (auto)
### Setup
- Seed: `S7_campaign_started_some_submitted --json` → `handles.campaign.main`

### Action (CLI, `--json`) / integration test
1) Вызвать `campaign.progress.get` по `handles.campaign.main` под ролью `hr_admin`.

### Assert
- В ответе корректные счётчики по статусам (>=1 submitted и >=1 not_started/in_progress, если seed это гарантирует).
- В списке “не закончил” присутствуют ожидаемые raters/анкеты.

### Client API ops (v1)
- `campaign.progress.get`

## Implementation plan (target repo)
- Contract:
  - Добавить op `campaign.progress.get` (input: `campaign_id`; output: counts + lists).
  - Output должен быть детерминированным и удобным для UI/CLI (без необходимости “додумывать”).
- Core:
  - Запросить questionnaires по кампании и сгруппировать по статусам.
  - Опционально: вернуть “pending questionnaires” (ids + subject + rater + role + status) для UI таблицы.
- DB:
  - Индексы по `questionnaires(campaign_id, status)` для быстрого прогресса.
- CLI:
  - Команда `campaign progress` печатает human summary и стабильный `--json`.
- Тонкие моменты:
  - После ended прогресс всё равно доступен HR (read-only).
  - Не раскрывать лишние поля (например raw open text) — это не часть progress.

## Tests
- Integration: `campaign.progress.get` возвращает ожидаемые counts на seed `S7`.
- RBAC: `employee/manager` не могут вызвать `campaign.progress.get` (typed `forbidden`).

## Memory bank updates
- При добавлении op обновить:
  - [Operation catalog](../../../../../spec/client-api/operation-catalog.md): SSoT ops. Читать, чтобы CLI/UI знали, что операция существует.
  - [CLI command catalog](../../../../../spec/cli/command-catalog.md): 1:1 команды. Читать, чтобы прогресс был воспроизводим через CLI.

## Verification (must)
- Automated test: `packages/core/test/ft/ft-0046-campaign-progress.test.ts` (integration) повторяет Acceptance и проверяет RBAC.
- Must run: GS12 должен быть зелёным.
