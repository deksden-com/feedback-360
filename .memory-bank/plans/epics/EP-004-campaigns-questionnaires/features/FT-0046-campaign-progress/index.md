# FT-0046 — Campaign progress view (HR)
Status: Completed (2026-03-04)

## User value
HR видит ход кампании: кто начал/сохранил черновик/отправил анкеты, и кому нужны напоминания.

## Deliverables
- Op `campaign.progress.get` (HR view): отдаёт по кампании:
  - агрегаты по статусам анкет (`not_started / in_progress / submitted`),
  - список “кто не закончил” (`pendingQuestionnaires`),
  - агрегаты pending по `rater/subject`,
  - timestamps (`campaignLockedAt`, per questionnaire `firstDraftAt/submittedAt` когда есть).
- CLI: `campaign progress <campaign_id> --json` (AI-friendly).
- Seed `S7_campaign_started_some_submitted` для deterministic acceptance прогресса.

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
- В ответе корректные счётчики по статусам (`notStarted=1`, `inProgress=1`, `submitted=1`).
- В списке “не закончил” ровно 2 анкеты (not_started + in_progress).
- `employee/manager` получают typed `forbidden`.

### Client API ops (v1)
- `campaign.progress.get`

## Implementation plan (target repo)
- Contract:
  - Добавлены типы/парсеры `CampaignProgressGetInput/Output`.
- Core:
  - Добавлен handler `runCampaignProgressGet` с RBAC (`hr_admin/hr_reader`).
- DB:
  - Добавлен `getCampaignProgress` и seed `S7`.
  - Добавлена миграция `0009_ft0046_campaign_progress.sql` (`questionnaires.first_draft_at`, индекс `campaign_id,status`).
- CLI:
  - Добавлена команда `campaign progress <campaign_id>`.
- Тонкие моменты:
  - Progress доступен только HR-ролям.
  - В progress не возвращаются тексты комментариев/прочие лишние поля.

## Tests
- Integration: `packages/core/src/ft/ft-0046-campaign-progress.test.ts`.
- CLI: `packages/cli/src/ft-0046-campaign-progress-cli.test.ts`.
- Seed: `packages/db/src/migrations/ft-0003-seed-runner.test.ts` (добавлена проверка `S7`).

## Memory bank updates
- При добавлении op обновить:
  - [Operation catalog](../../../../../spec/client-api/operation-catalog.md): SSoT ops. Читать, чтобы CLI/UI знали, что операция существует.
  - [CLI command catalog](../../../../../spec/cli/command-catalog.md): 1:1 команды. Читать, чтобы прогресс был воспроизводим через CLI.

## Verification (must)
- Automated test: `packages/core/src/ft/ft-0046-campaign-progress.test.ts` (integration) повторяет Acceptance и проверяет RBAC.
- Must run: GS12 должен быть зелёным.

## Project grounding (2026-03-04)
- [Questionnaires](../../../../../spec/domain/questionnaires.md): статусная модель анкет и read-only после ended.
- [Campaign lifecycle](../../../../../spec/domain/campaign-lifecycle.md): lock и статусные ограничения кампании.
- [Seed S7](../../../../../spec/testing/seeds/s7-campaign-started-some-submitted.md): детерминированный seed для progress/acceptance.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): порядок “код → тесты → evidence → docs”.

## Quality checks evidence (2026-03-04)
- `pnpm --filter @feedback-360/api-contract lint` → passed.
- `pnpm --filter @feedback-360/api-contract typecheck` → passed.
- `pnpm --filter @feedback-360/db lint` → passed.
- `pnpm --filter @feedback-360/db typecheck` → passed.
- `pnpm --filter @feedback-360/core lint` → passed.
- `pnpm --filter @feedback-360/core typecheck` → passed.
- `pnpm --filter @feedback-360/client lint` → passed.
- `pnpm --filter @feedback-360/client typecheck` → passed.
- `pnpm --filter @feedback-360/cli lint` → passed.
- `pnpm --filter @feedback-360/cli typecheck` → passed.

## Acceptance evidence (2026-03-04)
- `set -a; source .env; set +a; pnpm db:migrate` → passed (applied `0009_ft0046_campaign_progress.sql`).
- `pnpm --filter @feedback-360/cli exec vitest run src/ft-0046-campaign-progress-cli.test.ts` → passed.
- `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0046-campaign-progress.test.ts` → passed (integration, Supabase pooler).
- `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts` → passed (`S7` handles + status counts).
- CLI scenario (real DB, seed `S7_campaign_started_some_submitted`) via `pnpm exec tsx packages/cli/src/index.ts`:
  - `company use ... --role hr_admin` + `campaign progress ... --json` → `statusCounts={"notStarted":1,"inProgress":1,"submitted":1}`, `pendingQuestionnaires=2`.
  - `company use ... --role employee` + `campaign progress ... --json` → `error.code=forbidden`.
