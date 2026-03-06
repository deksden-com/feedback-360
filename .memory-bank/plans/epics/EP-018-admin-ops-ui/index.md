# EP-018 — Admin and ops UI
Status: Planned (2026-03-06)

## Goal
Добавить визуальный operational layer для beta/prod: health, release status, AI/webhook diagnostics и audit trail.

## Scope
- In scope: environment health dashboard, AI/webhook diagnostics, audit/release console.
- Out of scope: real AI integration semantics; UI only опирается на существующие job/webhook данные, а расширение AI контракта идёт отдельным non-GUI эпиком позже.

## Features (vertical slices)
- [Feature catalog](features/index.md): FT-0181..FT-0183. Читать, чтобы эксплуатация системы не зависела только от CLI и внешних панелей.

## Dependencies
- [EP-009 Test & release hardening](../EP-009-test-release-hardening/index.md): beta smoke/release gates и evidence policy. Читать, чтобы ops UI показывал реальные сигналы поставки.
- [EP-010 Production readiness](../EP-010-prod-readiness/index.md): runbook, observability, retention/privacy baseline. Читать, чтобы operational GUI не противоречил уже принятому способу эксплуатации.

## Progress report (evidence-based)
- `as_of`: 2026-03-06
- `total_features`: 3
- `completed_features`: 0
- `evidence_confirmed_features`: 0
- verification link:
  - [Verification matrix](../../verification-matrix.md): сюда пойдут checks для ops UI и beta/prod diagnostics. Читать, чтобы эксплуатационный интерфейс тоже был доказуемым.

## Definition of done
- Команда видит состояние окружений и интеграций в UI, а не только в внешних консолях.
- Audit и diagnostics не раскрывают лишние данные не тем ролям.
- Для каждой FT есть локальная и beta-проверка.
