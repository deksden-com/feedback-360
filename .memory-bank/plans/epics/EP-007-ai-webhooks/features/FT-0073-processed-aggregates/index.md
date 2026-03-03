# FT-0073 — Processed text aggregates + visibility
Status: Draft (2026-03-03)

## User value
Employee/Manager видят только AI обработанные тексты, HR видит raw. Это снижает риск deanonymization.

## Deliverables
- Хранение агрегатов processed/summary per `(subject, competency, group)`.
- Витрины результатов:
  - employee/manager: без raw полей,
  - hr: raw + processed.

## Context (SSoT links)
- [AI processing](../../../../../spec/ai/ai-processing.md): что именно AI возвращает (processed + summary) и как мы это храним. Читать, чтобы “обработанные комменты” были агрегированы правильно.
- [Results visibility](../../../../../spec/domain/results-visibility.md): кто видит raw vs processed. Читать, чтобы приватность соблюдалась по умолчанию.
- [Anonymity policy](../../../../../spec/domain/anonymity-policy.md): маленькие группы и скрытие. Читать, чтобы processed тексты не увеличивали риск deanonymization.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): общий чеклист. Читать, чтобы хранение/витрины были согласованы с RBAC.

## Acceptance (auto)
### Setup
- Seed: `S9_campaign_completed_with_ai --json` → `handles.campaign.main`

### Action (CLI, `--json`) (planned auth contexts)
1) employee: `results my --campaign <handles.campaign.main> --json`
2) manager: `results team --campaign <handles.campaign.main> --subject <employee_id> --json`
3) hr_reader: `results hr --campaign <handles.campaign.main> --subject <employee_id> --json`

### Assert
- Employee/Manager не получают raw open text полей, только processed/summary.
- HR view содержит raw (MVP) и processed/summary.

### Client API ops (v1)
- `results.getMyDashboard`
- `results.getTeamDashboard`
- `results.getHrView`

## Implementation plan (target repo)
- Storage:
  - Таблица/структура для AI текстов per `(campaign_id, subject_employee_id, competency_id, rater_group)`:
    - `raw_text` (HR only),
    - `processed_text`,
    - `summary_text`.
  - Применение webhook результата должно быть идемпотентным (с receipts из FT-0072).
- Results views:
  - Employee/Manager DTO не содержит `raw_text` полей вообще (не nullable, а отсутствуют).
  - HR view содержит raw + processed + summary (MVP, включая hr_reader).
- Тонкие моменты:
  - Если AI ещё не отработал, employee/manager видят пусто/placeholder (но не raw).

## Tests
- Integration: role-based shaping (employee/manager без raw, HR с raw).
- Contract: runtime схемы “employee view” не допускают raw полей.

## Memory bank updates
- При изменении модели хранения обновить: [AI processing](../../../../../spec/ai/ai-processing.md) — SSoT. Читать, чтобы webhook и витрины ссылались на одинаковые поля.

## Verification (must)
- Automated test: `packages/core/test/ft/ft-0073-processed-text-visibility.test.ts` (integration) проверяет, что employee/manager не получают raw, HR получает raw+processed.
- Must run: `pnpm -r test` + роль-based checks (и GS1 остаётся зелёным по части visibility).
