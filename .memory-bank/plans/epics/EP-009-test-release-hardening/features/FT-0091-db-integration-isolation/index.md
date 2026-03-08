---
description: FT-0091-db-integration-isolation feature plan and evidence entry for EP-009-test-release-hardening.
purpose: Read when implementing, verifying, or auditing this vertical slice so plan, acceptance, and evidence stay aligned.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-009-test-release-hardening/index.md
epic: EP-009
feature: FT-0091
---


# FT-0091 — DB integration isolation
Status: Completed (2026-03-05)

## User value
Команда и ИИ-агенты получают надёжные integration tests: тесты либо зелёные по делу, либо падают из-за реальной регрессии, а не из-за параллельных миграций, shared seed state или deadlock.

## Deliverables
- Изолированный DB integration lane для `packages/db`/`packages/core`, не конфликтующий с unit lane.
- Детеминированный reset/cleanup подход для seed-based тестов.
- Явное правило serial execution там, где shared DB unavoidable.
- Обновлённые test commands и docs по запуску integration suite.

## Context (SSoT links)
- [Testing standards](../../../../../spec/engineering/testing-standards.md): уровни тестов и правила quality gates. Читать, чтобы isolation встраивалась в общий test policy, а не жила отдельно.
- [Seed scenarios](../../../../../spec/testing/seed-scenarios.md): как seeds должны работать как контракт для тестов. Читать, чтобы isolation не ломала handles и acceptance сценарии.
- [Traceability](../../../../../spec/testing/traceability.md): связь инвариантов с тестами и seed-состояниями. Читать, чтобы стабилизация тестов не ослабила покрытие.
- [Runbook](../../../../../spec/operations/runbook.md): как запускать проверки в CI/beta. Читать, чтобы команды и окружения были едиными.

## Acceptance (auto)
### Setup
- Локальная БД / pooled DB URL доступны.
- Запускается integration suite, который раньше страдал от deadlock/shared-state падений.

### Action
1) Прогнать DB integration suite последовательно в выделенном lane.
2) Повторно прогнать тот же набор второй раз без ручной очистки.
3) Прогнать workspace checks в CI-эквивалентном порядке.

### Assert
- Оба запуска зелёные.
- Нет duplicate-key / foreign-key / deadlock ошибок из-за межтестового состояния.
- Seed scenarios воспроизводимы при повторном запуске.

## Implementation plan (target repo)
- Разделить test lanes на unit/contract и DB integration.
- Для DB integration:
  - либо отдельная transient schema/database per run,
  - либо строгий serialized runner + cleanup/reset между тестами.
- Пересмотреть тесты, которые сейчас implicitly полагаются на глобальное состояние.
- Зафиксировать каноничные команды в package/workflow config.
- Обновить docs: где и как запускать DB lane локально и в CI.

## Tests
- Integration: проблемные DB tests должны стабильно проходить два последовательных запуска.
- Regression: `pnpm -r test` или его CI-эквивалент больше не падает на известных flaky кейсах.

## Memory bank updates
- Обновить [Testing standards](../../../../../spec/engineering/testing-standards.md) и [Runbook](../../../../../spec/operations/runbook.md), если меняется topology запуска и требования к окружению.

## Verification (must)
- Automated test: целевой DB integration lane + повторный rerun без ручного вмешательства.
- Must run: локальный запуск integration suite и GitHub `checks` lane.

## Manual verification (deployed environment)
N/A — это инфраструктурная/test-harness фича; ручная проверка идёт через CI logs и локальные rerun.

## Quality checks evidence (2026-03-05)
- Checks run:
  - `pnpm test:db`
  - `pnpm test:db`
  - `pnpm checks`
- Result:
  - passed; curated DB lane дважды подряд отработал без duplicate-key / FK drift / flaky cleanup;
  - workspace gate тоже зелёный после выделения DB lane из `pnpm -r test`.

## Acceptance evidence (2026-03-05)
- Commands/tests run:
  - `pnpm --filter @feedback-360/db test:db`
  - `pnpm --filter @feedback-360/client test:db`
  - `pnpm --filter @feedback-360/core test:db`
  - `pnpm --filter @feedback-360/db exec vitest run --testTimeout=20000 --maxWorkers=1 --no-file-parallelism src/migrations/ft-0091-db-integration-isolation.test.ts`
- Result:
  - passed; `FT-0091 DB integration isolation` подтверждает, что canonical seeds воспроизводятся повторно на той же БД;
  - `ft-0023` автоматически skip-ится на pooled cloud DB, не делая lane ложнопадающим.

## CI/CD evidence
- GitHub:
  - PR checks: `https://github.com/deksden-com/feedback-360/actions/runs/22735424128`
  - Status: `success`
- Vercel:
  - Not applicable — фича про test topology, не про runtime UI deploy.
