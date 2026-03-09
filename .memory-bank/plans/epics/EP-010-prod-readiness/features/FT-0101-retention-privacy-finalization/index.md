---
description: FT-0101-retention-privacy-finalization feature plan and evidence entry for EP-010-prod-readiness.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-010-prod-readiness/index.md
epic: EP-010
feature: FT-0101
---


# FT-0101 — Retention and privacy policy finalization
Status: Completed (2026-03-06)

## User value
HR, руководители и сотрудники работают по понятным правилам хранения и видимости данных; у команды нет “серой зоны” по raw comments, soft delete и срокам хранения.

## Deliverables
- Финализированный документ retention/privacy policy.
- Явные решения по raw/processed comments, soft delete, archival/deletion lifecycle.
- Если нужно — технические follow-up tasks на enforcement.

## Context (SSoT links)
- [Data retention & privacy](../../../../../spec/operations/data-retention-privacy.md): текущий draft и открытый риск по retention. Читать, чтобы закрыть именно незавершённые policy-решения.
- [Results visibility](../../../../../spec/domain/results-visibility.md): кто видит raw vs processed. Читать, чтобы privacy policy совпадала с product behavior.
- [RBAC](../../../../../spec/security/rbac.md): роль HR Reader и правила доступа к HR view. Читать, чтобы policy и access model не расходились.

## Acceptance (auto/process)
### Setup
- Есть текущая draft policy и текущая реализация visibility.

### Action
1) Принять policy decisions и обновить SSoT docs.
2) Обновить runtime behavior для `hr_reader`/`hr_admin`, если policy требует изменений.
3) Проверить, что policy не противоречит текущим тестам и role behavior.

### Assert
- В docs нет открытой неопределённости по retention срокам и raw access.
- Policy согласована с RBAC/results visibility.
- Policy согласована и с docs, и с runtime behavior.

## Implementation plan (target repo)
- Провести policy sweep по ops/security/domain docs.
- Зафиксировать canonical decisions.
- Обновить glossary/terminology при необходимости.
- Обновить runtime shaping `results.getHrView` и HR UI, если policy требует сужения raw access.

## Tests
- Docs consistency review.
- Targeted tests на role visibility (`hr_reader` без raw, `hr_admin` с raw).

## Memory bank updates
- Обновить [Data retention & privacy](../../../../../spec/operations/data-retention-privacy.md), [Results visibility](../../../../../spec/domain/results-visibility.md), [RBAC](../../../../../spec/security/rbac.md), [Glossary](../../../../../spec/glossary.md).

## Verification (must)
- Docs review with resolved open questions.
- Must run: consistency check against current role/result tests.

## Manual verification (deployed environment)
- Environment:
  - target: `beta` after deploy to `develop`
  - Date: `2026-03-06`
- Steps:
  1. Подготовить completed campaign dataset.
  2. Открыть HR results view как `hr_reader` и проверить отсутствие raw text.
  3. Открыть HR results view как `hr_admin` и проверить наличие raw text.
- Expected:
  - `hr_reader` получает только processed/summary,
  - `hr_admin` получает raw + processed + summary.

## Quality checks evidence (2026-03-06)
- `pnpm --filter @feedback-360/db lint` → passed.
- `pnpm --filter @feedback-360/db typecheck` → passed.
- `pnpm --filter @feedback-360/db exec vitest run --testTimeout=45000 --maxWorkers=1 --no-file-parallelism src/migrations/ft-0003-seed-runner.test.ts src/migrations/ft-0091-db-integration-isolation.test.ts` → passed.
- `pnpm --filter @feedback-360/core lint` → passed.
- `pnpm --filter @feedback-360/core typecheck` → passed.
- `pnpm --filter @feedback-360/core test -- ft-0055-results-views.test.ts ft-0073-processed-text-visibility.test.ts` → passed.
- `pnpm --filter @feedback-360/web lint` → passed.
- `pnpm --filter @feedback-360/web typecheck` → passed.
- `pnpm --filter @feedback-360/web build` → passed.
- `pnpm --filter @feedback-360/web exec playwright test --config playwright/playwright.config.mjs tests/ft-0101-results-privacy.spec.ts` → passed.

## Acceptance evidence (2026-03-06, local baseline)
- Updated policy SSoT:
  - `spec/operations/data-retention-privacy.md`
  - `spec/domain/results-visibility.md`
  - `spec/security/rbac.md`
  - `spec/glossary.md`
- Runtime verification:
  - `packages/core/src/ft/ft-0055-results-views.test.ts` → `hr_reader` no longer receives `rawText`, `hr_admin` still receives `rawText`.
  - `packages/core/src/ft/ft-0073-processed-text-visibility.test.ts` → post-webhook processed text remains visible to `employee/manager/hr_reader`, while raw remains visible only to `hr_admin`.
- Browser acceptance:
  - `apps/web/playwright/tests/ft-0101-results-privacy.spec.ts` seeds `S9_campaign_completed_with_ai`, logs in as `hr_reader` and `hr_admin`, and verifies that the HR results page hides `rawText` for `hr_reader` while preserving raw + processed + summary for `hr_admin`.
- Artifacts:
  - `![ft-0101-hr-reader-redacted](../../../../../evidence/EP-010/FT-0101/2026-03-06/step-01-hr-reader-results-redacted.png)`
  - `![ft-0101-hr-admin-raw](../../../../../evidence/EP-010/FT-0101/2026-03-06/step-02-hr-admin-results-with-raw.png)`
- Beta acceptance:
  - `PLAYWRIGHT_BASE_URL=https://beta.go360go.ru pnpm --filter @feedback-360/web exec playwright test --config playwright/playwright.config.mjs tests/ft-0101-results-privacy.spec.ts` → passed on deployed beta.
