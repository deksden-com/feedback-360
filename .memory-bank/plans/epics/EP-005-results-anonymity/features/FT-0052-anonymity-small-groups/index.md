# FT-0052 — Anonymity threshold + small groups (hide/merge)
Status: Draft (2026-03-03)

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
1) `results my --campaign <handles.campaign.main> --json` (или `results team/hr` по роли)

### Assert
- peers скрыт (hide) или слит в `other` (merge_to_other), согласно policy.
- Per-competency threshold применяется по `n_valid`.

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
- Unit: policy hide/merge при `n=2` и per-competency `n_valid`.
- Integration: `results my` на variant `peers2` отдаёт `visibility=hidden|merged` без raw раскрытия.

## Memory bank updates
- При изменении порога/правил обновить: [Anonymity policy](../../../../../spec/domain/anonymity-policy.md) — SSoT. Читать, чтобы правки не “расползлись” между витринами.

## Verification (must)
- Automated test: `packages/core/test/ft/ft-0052-anonymity.test.ts` (unit+integration) проверяет hide/merge + per-competency threshold на `S7 --variant peers2`.
- Must run: GS2 должен быть зелёным.
