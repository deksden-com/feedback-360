---
description: EP-019-admin-ops-ui epic plan, scope, progress, and evidence entrypoint.
purpose: Read to understand the user value, feature map, and completion state of this epic.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/index.md
epic: EP-019
---


# EP-019 — Admin and ops UI
Status: Completed (2026-03-06)

## Goal
Добавить визуальный operational layer для beta/prod: health, release status, AI/webhook diagnostics и audit trail.

## Scope
- In scope: environment health dashboard, AI/webhook diagnostics, audit/release console.
- Out of scope: real AI integration semantics; UI only опирается на существующие job/webhook данные, а расширение AI контракта идёт отдельным non-GUI эпиком позже.

## Features (vertical slices)
- [Feature catalog](features/index.md): FT-0191..FT-0193. Читать, чтобы эксплуатация системы не зависела только от CLI и внешних панелей.

## Dependencies
- [EP-009 Test & release hardening](../EP-009-test-release-hardening/index.md): beta smoke/release gates и evidence policy. Читать, чтобы ops UI показывал реальные сигналы поставки.
- [EP-010 Production readiness](../EP-010-prod-readiness/index.md): runbook, observability, retention/privacy baseline. Читать, чтобы operational GUI не противоречил уже принятому способу эксплуатации.
- [EP-014 Feature-area slice refactor](../EP-014-feature-area-slices-refactor/index.md): target structure для ops/diagnostics code paths и docs. Читать, чтобы operational UI развивался на обслуживаемом foundation.

## Progress report (evidence-based)
- `as_of`: 2026-03-06
- `total_features`: 3
- `completed_features`: 3
- `evidence_confirmed_features`: 3
- verification link:
  - [Verification matrix](../../verification-matrix.md): сюда пойдут checks для ops UI и beta/prod diagnostics. Читать, чтобы эксплуатационный интерфейс тоже был доказуемым.

## Definition of done
- Команда видит состояние окружений и интеграций в UI, а не только в внешних консолях.
- Audit и diagnostics не раскрывают лишние данные не тем ролям.
- Для каждой FT есть локальная и beta-проверка.

## Progress note (2026-03-06)
- EP-019 реализован как единый `/ops` surface для HR ролей.
- Health/release card показывает runtime environment, build metadata и базовые integration checks.
- AI diagnostics показывает jobs, webhook receipts и duplicate delivery markers.
- Audit console даёт фильтры по campaign/event/actor и редактирует чувствительные поля для `hr_reader`.
