---
description: FT-0052-anonymity-small-groups feature plan and evidence entry for EP-005-results-anonymity.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-005-results-anonymity/index.md
epic: EP-005
feature: FT-0052
---


# FT-0052 — Anonymity threshold + small groups (hide/merge)
Status: Completed (2026-03-05)

## User value
Система скрывает/сливает группы при малом числе оценщиков, предотвращая раскрытие личности.

## Deliverables
- Threshold=3 для peers/subordinates:
  - на уровне группы в целом,
  - и на уровне (group×competency) по `n_valid`.
- `small_group_policy`: `hide` (default) или `merge_to_other`.

## Context (SSoT links)
- [Anonymity policy](../../../../../spec/domain/anonymity-policy.md): порог и правила hide/merge, включая per-competency threshold. Читать, чтобы реализация не допускала deanonymization.
- [Results visibility](../../../../../spec/domain/results-visibility.md): как отдаём “скрытые” группы (flags/merged groups). Читать, чтобы UI/CLI корректно отображали результат.
- [GS2 Small group anonymity](../../../../../spec/testing/scenarios/gs2-small-group-anonymity.md): golden сценарий edge cases. Читать, чтобы acceptance тест проверял “как скрываем” детерминированно.
- [Seed S7](../../../../../spec/testing/seeds/s7-campaign-started-some-submitted.md): где фиксировать variant `peers2`. Читать, чтобы тесты не правили данные вручную.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист реализации. Читать, чтобы policy был в core и покрыт unit тестом.

## Acceptance (auto)
### Setup
- Seed: `S7_campaign_started_some_submitted --variant peers2`.

### Action (CLI, `--json`)
1) `results hr --campaign <handles.campaign.main> --subject <handles.employee.subject_main> --json` (default policy `hide`).
2) `results hr --campaign <handles.campaign.main> --subject <handles.employee.subject_main> --small-group-policy merge_to_other --json`.

### Assert
- `hide`: `groupVisibility.peers=subordinates=hidden`.
- `merge_to_other`: `groupVisibility.peers=subordinates=merged`, `groupVisibility.other=shown`.
- Per-competency threshold: при `merge_to_other` для компетенции `competency.secondary` получаем `otherVisibility=hidden` (недостаточно `n_valid`).

## Implementation plan (target repo)
- Core (anonymity policy):
  - Для каждой группы (peers/subordinates) вычислять:
    - `n_raters` (на уровне группы),
    - `n_valid` на уровне (group×competency) (исключая NA/UNSURE).
  - Правила:
    - `manager` всегда персонально (не анонимно).
    - Self показываем (для gaps), но вес=0.
    - Для peers/subordinates:
      - если `n_raters < threshold` (3) → group скрыта или merged (`small_group_policy`).
      - если на конкретной компетенции `n_valid < threshold` → компетенция в группе скрыта/merged (даже если группа в целом проходит порог).
- API shape:
  - В `results.*` отдавать явные признаки: `visibility: shown|hidden|merged`, чтобы UI/CLI не “догадывались”.
- Тонкие моменты:
  - “merge_to_other” должен быть предсказуем: какие группы сливаем и как считаем weights после merge (см. FT-0053).

## Tests
- Integration: `results.getHrView` на variant `peers2` отдаёт `visibility=hidden|merged` и per-competency visibility по `n_valid`.
- CLI: `results hr` прокидывает `--small-group-policy/--anonymity-threshold` в typed input.

## Memory bank updates
- При изменении порога/правил обновить: [Anonymity policy](../../../../../spec/domain/anonymity-policy.md) — SSoT. Читать, чтобы правки не “расползлись” между витринами.

## Verification (must)
- Automated test: `packages/core/src/ft/ft-0052-anonymity.test.ts` (integration) проверяет hide/merge + per-competency threshold на `S7 --variant peers2`.
- Automated test: `packages/cli/src/ft-0052-results-hr-anonymity-cli.test.ts` проверяет прокидывание CLI опций в typed client.
- Must run: GS2 должен быть зелёным.

## Project grounding (2026-03-05)
- [Anonymity policy](../../../../../spec/domain/anonymity-policy.md): canonical threshold/hide/merge правила. Читать, чтобы visibility считалась по SSoT и не допускала deanonymization.
- [GS2 Small group anonymity](../../../../../spec/testing/scenarios/gs2-small-group-anonymity.md): acceptance intent для merge/hide edge case. Читать, чтобы автотест проверял именно бизнес-инварианты.
- [Seed S7](../../../../../spec/testing/seeds/s7-campaign-started-some-submitted.md): variant `peers2` и handles. Читать, чтобы сценарий был детерминированным и воспроизводимым.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): порядок “vertical slice + evidence”. Читать, чтобы завершить фичу через checks+acceptance.

## Quality checks evidence (2026-03-05)
- `pnpm --filter @feedback-360/api-contract lint && pnpm --filter @feedback-360/api-contract typecheck` → passed.
- `pnpm --filter @feedback-360/db lint && pnpm --filter @feedback-360/db typecheck` → passed.
- `pnpm --filter @feedback-360/core lint && pnpm --filter @feedback-360/core typecheck` → passed.
- `pnpm --filter @feedback-360/client lint && pnpm --filter @feedback-360/client typecheck` → passed.
- `pnpm --filter @feedback-360/cli lint && pnpm --filter @feedback-360/cli typecheck` → passed.

## Acceptance evidence (2026-03-05)
- `pnpm --filter @feedback-360/cli exec vitest run src/ft-0051-results-hr-cli.test.ts src/ft-0052-results-hr-anonymity-cli.test.ts` → passed.
- `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0051-indicators-aggregations.test.ts` → passed (FT-0051 no-regression).
- `set -a; source .env; set +a; pnpm --filter @feedback-360/core exec vitest run src/ft/ft-0052-anonymity.test.ts` → passed (integration, Supabase pooler).
- `set -a; source .env; set +a; pnpm --filter @feedback-360/db exec vitest run src/migrations/ft-0003-seed-runner.test.ts` → passed (`S7 --variant peers2`).
- CLI scenario (real DB, seed `S7_campaign_started_some_submitted --variant peers2`) via `pnpm exec tsx packages/cli/src/index.ts`:
  - default policy (`hide`) → `groupVisibility.peers=hidden`, `groupVisibility.subordinates=hidden`.
  - `--small-group-policy merge_to_other` → `groupVisibility.other=shown`, `competency.secondary.otherVisibility=hidden`.
  - `employee` role on `results hr` → `error.code=forbidden`.
