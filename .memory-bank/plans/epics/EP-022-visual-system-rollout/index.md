---
description: EP-022-visual-system-rollout epic plan, scope, progress, and evidence entrypoint.
purpose: Read to understand the user value, feature map, and completion state of this epic.
status: Active
date: 2026-03-09
parent: .memory-bank/plans/epics/index.md
epic: EP-022
---


# EP-022 — Unified visual system rollout
Status: Completed (2026-03-08)

## Goal
Раскатить по всему приложению единый визуальный язык в стиле нового `login` / refined `dashboard` / refined `questionnaire`: спокойный современный B2B SaaS интерфейс с сильной иерархией, аккуратными surfaces и привычными CRUD/report patterns — **без потери текущей функциональности и доменных ограничений**.

## Why a new epic
`EP-021` закрыл traceability, predictable selectors и первый SaaS polish. Следующий шаг — уже не точечный polish, а **системная визуальная консолидация всего продукта** вокруг единого visual baseline. Это отдельная волна работ, поэтому её лучше вести новым эпиком, а не растягивать закрытый `EP-021`.

## Starting point (already ready)
- `SCR-APP-HOME` уже служит живым baseline для dashboard composition: hero + KPI + tasks + shortcuts + activity.
- `SCR-QUESTIONNAIRES-FILL` уже служит живым baseline для form/report-like questionnaire surface.
- `EP-022` не начинает с нуля: он **дораскатывает** этот стиль на auth, shell, CRUD/admin, inbox и results, а также выравнивает design-system docs под уже появившийся visual language.

## Scope
- In scope:
  - design system v2 based on the new visual baseline;
  - auth/public entry polish;
  - shell/dashboard alignment;
  - CRUD/admin screens alignment;
  - form/report surfaces alignment;
  - screenshot/docs refresh for materially changed screens.
- Out of scope:
  - новые доменные функции;
  - изменение calculations, anonymity, RBAC, lifecycle rules;
  - AI/Telegram/integration behavior changes.

## Features
- [Feature catalog](features/index.md): FT-0221..FT-0226. Читать, чтобы rollout шёл как серия проверяемых visual slices, а не как большой хаотичный редизайн.

## Dependencies
- [EP-021 UI traceability and SaaS polish](../EP-021-ui-traceability-saas-polish/index.md) — screen ids, test ids и базовый polish. Читать, чтобы новый rollout строился на уже наведённом порядке, а не поверх ad-hoc UI.
- [Design system index](../../../spec/ui/design-system/index.md) — текущий SSoT визуальных правил. Читать, чтобы новый epic расширял design system, а не жил отдельно.
- [Visual baseline v2](../../../spec/ui/design-system/visual-baseline-v2.md) — новый стилистический ориентир. Читать первым, чтобы все FT опирались на одну и ту же композицию и типографику.
- [Screen registry](../../../spec/ui/screen-registry.md) — канонические `screen_id`. Читать, чтобы visual rollout оставался трассируемым до docs, screenshots и automation.

## Definition of done
- Login/auth, shell, CRUD/admin, questionnaire и results surfaces ощущаются как части одного продукта.
- Все materially updated screens используют одну систему surfaces, typography, spacing, CTA hierarchy and status semantics.
- Guides/evidence screenshots синхронизированы с новым visual baseline.
- Acceptance сценарии подтверждают, что UI обновился без потери действий, ролей и ограничений.

## Progress report (planned)
- `as_of`: 2026-03-08
- `total_features`: 6
- `completed_features`: 6
- `evidence_confirmed_features`: 6
- verification link:
  - [Verification matrix](../../verification-matrix.md): execution evidence по каждому visual rollout slice. Читать, чтобы completion был подтверждён quality gate, acceptance и обновлёнными screenshots.

## Completion evidence (2026-03-08)
- `FT-0221` закрепил visual baseline v2 и связал его с design-system docs и rollout-эпиком.
- `FT-0222` раскатил новый стиль на `SCR-AUTH-LOGIN` и `SCR-COMPANY-SWITCHER`.
- `FT-0223` довёл shell/dashboard chrome до единого SaaS-style workspace.
- `FT-0224` подтвердил HR CRUD/campaign surfaces в том же visual family и сохранил привычные admin patterns.
- `FT-0225` довёл questionnaire/results family до той же visual system.
- `FT-0226` обновил tutorial/screenshots, чтобы handoff и guides показывали актуальный UI.
- Quality gate:
  - `pnpm --filter @feedback-360/web lint`
  - `pnpm --filter @feedback-360/web typecheck`
  - `pnpm --filter @feedback-360/web build`
  - `pnpm docs:audit`
  - `node scripts/audit-memory-bank.mjs --ep EP-022`
