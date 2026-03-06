# FT-0055 — Results views (employee/manager/hr)
Status: Completed (2026-03-05)

## User value
Каждая роль видит “свою” витрину результатов без нарушения приватности и анонимности.

## Deliverables
- `results.getMyDashboard` (employee)
- `results.getTeamDashboard` (manager)
- `results.getHrView` (hr_admin/hr_reader)
- Open text:
  - employee/manager: только AI processed/summary
  - hr_reader: только AI processed/summary
  - hr_admin: raw + processed + summary

## Context (SSoT links)
- [Results visibility](../../../../../spec/domain/results-visibility.md): SSoT правил “кто что видит”. Читать, чтобы response shape не раскрывал raw open text не тем ролям.
- [Anonymity policy](../../../../../spec/domain/anonymity-policy.md): hide/merge и threshold. Читать, чтобы витрины выдавали “безопасные” группы.
- [AI processing](../../../../../spec/ai/ai-processing.md): что такое processed/summary и где хранится. Читать, чтобы витрины ссылались на правильные поля.
- [RBAC spec](../../../../../spec/security/rbac.md): роли и allowed ops. Читать, чтобы доступ к HR view был только для hr_*.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист. Читать, чтобы витрины были тонкими над core вычислениями.

## Acceptance (auto)
### Setup
- Seed: `S9_campaign_completed_with_ai --json` → `handles.campaign.main`

### Action (CLI, `--json`) (planned auth contexts)
1) Под employee: `results my --campaign <handles.campaign.main> --json`
2) Под manager: `results team --campaign <handles.campaign.main> --subject <employee_id> --json`
3) Под hr_reader: `results hr --campaign <handles.campaign.main> --subject <employee_id> --json`
4) Под hr_admin: `results hr --campaign <handles.campaign.main> --subject <employee_id> --json`

### Assert
- Employee/Manager response не содержит raw open text полей.
- `hr_reader` response не содержит raw open text полей.
- `hr_admin` response содержит raw open text и processed/summary.

## Implementation plan (target repo)
- Contract:
  - Определить три distinct output DTO (или один DTO с role-based shaping на сервере, но лучше — явные различия):
    - employee dashboard,
    - manager/team dashboard,
    - HR view (самый полный).
  - Явно указать в схемах, какие поля могут присутствовать (чтобы “raw” нельзя было случайно вернуть employee).
- Core:
  - Общая функция “compute results” (или сервис) возвращает полный internal representation.
  - Затем “view shaping” (role-based) отрезает поля согласно visibility + RBAC.
- Тонкие моменты:
  - raw open text остаётся только у `hr_admin`; `hr_reader` получает ту же HR-витрину без `rawText`.
  - При отсутствии AI processed данных employee должен получать пусто/placeholder, но не raw.

## Tests
- Integration: один и тот же кампейн:
  - employee results не содержит raw,
  - manager results не содержит raw,
  - hr_reader results не содержит raw,
  - hr_admin results содержит raw.
- Contract: runtime-схемы гарантируют отсутствие raw полей в employee DTO.

## Memory bank updates
- При изменении видимости обновить: [Results visibility](../../../../../spec/domain/results-visibility.md) — SSoT. Читать, чтобы политика приватности была единой во всех витринах.

## Verification (must)
- Automated test: `packages/core/src/ft/ft-0055-results-views.test.ts` (integration) проверяет role-based shaping (employee/manager/hr_reader без raw, `hr_admin` с raw) и анонимность flags.
- Must run: GS1 (happy path) должен оставаться зелёным (включая “кто что видит”).

## Project grounding (2026-03-05)
- [Results visibility](../../../../../spec/domain/results-visibility.md): SSoT правил raw/processed по ролям. Читать, чтобы не допустить утечки raw комментариев в employee/manager view.
- [Anonymity policy](../../../../../spec/domain/anonymity-policy.md): threshold и merge/hide политика. Читать, чтобы витрины результатов соблюдали деанонимизацию.
- [GS1 Happy path](../../../../../spec/testing/scenarios/gs1-happy-path.md): сквозной сценарий продукта. Читать, чтобы проверить регрессию после добавления новых витрин.
- [Seed S9](../../../../../spec/testing/seeds/s9-campaign-completed-with-ai.md): готовый completed dataset с processed open text. Читать, чтобы acceptance был детерминированным.

## Quality checks evidence (2026-03-05)
- `pnpm --filter @feedback-360/api-contract lint && pnpm --filter @feedback-360/api-contract typecheck && pnpm --filter @feedback-360/db lint && pnpm --filter @feedback-360/db typecheck && pnpm --filter @feedback-360/core lint && pnpm --filter @feedback-360/core typecheck && pnpm --filter @feedback-360/client lint && pnpm --filter @feedback-360/client typecheck && pnpm --filter @feedback-360/cli lint && pnpm --filter @feedback-360/cli typecheck` → passed.

## Acceptance evidence (2026-03-05)
- `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0055-results-views.test.ts` → passed.
- `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts` → passed (`S9_campaign_completed_with_ai`).
- CLI scenario (real DB, seed `S9_campaign_completed_with_ai`) via `pnpm --filter @feedback-360/cli exec tsx src/index.ts`:
  - `results my --campaign <campaign_id> --json` → `openText` без `rawText`.
  - `results team --campaign <campaign_id> --subject <employee_id> --json` → `openText` без `rawText`.
  - `results hr --campaign <campaign_id> --subject <employee_id> --json` под `hr_reader` → `openText` без `rawText`.
  - `results hr --campaign <campaign_id> --subject <employee_id> --json` под `hr_admin` → есть `rawText` + `processedText`.
- GS1 regression subset (real DB, sequential):
  - `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0013-questionnaires.test.ts src/ft/ft-0044-lock-on-draft-save.test.ts src/ft/ft-0045-ended-readonly.test.ts --fileParallelism=false` → passed.
  - `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0071-ai-run.test.ts --testTimeout 30000` → passed.

## Notes
- DB-backed integration tests запускаем последовательными таргетированными командами (или с увеличенным `testTimeout`) для стабильных proof-результатов на shared Supabase beta DB.
