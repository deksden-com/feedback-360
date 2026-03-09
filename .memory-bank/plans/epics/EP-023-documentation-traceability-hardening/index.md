---
description: EP-023-documentation-traceability-hardening epic plan, scope, progress, and evidence entry for strengthening docs quality, traceability, and ownership links.
purpose: Read to understand the scope, completion state, and verification evidence for the documentation hardening wave.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/epics/index.md
epic: EP-023
---

# EP-023 — Documentation traceability and SSoT hardening
Status: Completed (2026-03-09)

## Goal
Подтянуть качество документации до уровня, где `spec`, `plans`, `guides`, `ADR`, код и JSDoc образуют один связный граф, а не “хороший набор документов рядом с кодом”.

## Why a new epic
После усиления `mbb/` и приведения frontmatter в базовый порядок стало видно, что следующий bottleneck уже не в отсутствии правил, а в их неполном применении:
- `@screenId` / `@testIdScope` уже раскатаны хорошо;
- `@docs` / `@see` в коде почти не используются;
- screen specs покрывают не все route-level surfaces и пока неглубокие;
- docs → code ownership links существуют как стандарт, но почти не внедрены в живые документы;
- metadata/status/traceability still mixed between legacy and new patterns.

Это системная quality wave, а не один локальный patch, поэтому её лучше вести отдельным эпиком.

## Scope
- In scope:
  - rollout `@docs` / `@see` на ключевые entrypoints;
  - completion и углубление screen specs;
  - docs → code / tests ownership links;
  - metadata normalization for memory-bank docs;
  - reference/guides completion for quick lookup;
  - automated traceability checks.
- Out of scope:
  - новые доменные функции;
  - новый UI/UX redesign beyond documentation needs;
  - изменение business rules ради “удобства документации”.

## Features
- [Feature catalog](features/index.md) — FT-0231..FT-0236. Читать, чтобы закрывать проблему документации категориями, а не разрозненными cleanup-правками.

## Dependencies
- [MBB index](../../../mbb/index.md) — актуальная “библия” memory-bank. Читать, чтобы EP-023 усиливал практическое соответствие правилам, а не придумывал параллельный стандарт.
- [Cross-references](../../../mbb/cross-references.md) — правило двусторонней навигации docs ↔ code. Читать первым, потому что именно оно становится основным предметом rollout.
- [Coding style](../../../spec/engineering/coding-style.md) — проектный стандарт JSDoc и UI traceability. Читать, чтобы rollout `@docs` / `@see` продолжал уже существующие conventions, а не конфликтовал с ними.
- [Screen registry](../../../spec/ui/screen-registry.md) — канонический список экранов и текущих gaps по screen specs. Читать, чтобы FT-0232 закрывал реестр до полного и одинаково подробного состояния.
- [Documentation standards](../../../spec/engineering/documentation-standards.md) — границы WHAT/WHY/HOW-TO/reference. Читать, чтобы hardening улучшал структуру, а не смешивал типы документов.

## Definition of done
- Ключевые entrypoints в `apps/` и `packages/` имеют `@docs` / `@see` и указывают на нормативные docs.
- Route-level screens из `screen-registry.md` имеют не только `screen_id`, но и полноценные screen specs.
- Приоритетные spec/plan docs указывают owning implementation paths и relevant tests.
- Metadata/frontmatter/status conventions больше не смешиваются хаотично.
- Есть automated audit, который ловит основные traceability drifts до merge.

## Progress report
- `total_features`: 6
- `completed_features`: 6
- `evidence_confirmed_features`: 6
- verification link:
  - [Verification matrix](../../verification-matrix.md) — сюда по мере реализации добавляются checks/evidence по FT-023*. Читать, чтобы hardening закрывался доказуемо, а не только “ручным впечатлением”.

## Completion evidence (2026-03-09)
- Local quality gate:
  - `pnpm docs:audit`
  - `pnpm --filter @feedback-360/web lint`
  - `pnpm --filter @feedback-360/web typecheck`
  - `pnpm --filter @feedback-360/core typecheck`
  - `pnpm --filter @feedback-360/client typecheck`
  - `pnpm --filter @feedback-360/cli typecheck`
  - `node scripts/audit-memory-bank.mjs --ep EP-023`
- Acceptance highlights:
  - route-level `page.tsx` surfaces now carry `@docs` alongside `@screenId` / `@testIdScope`;
  - `screen-registry.md` no longer leaves coded route screens in `planned` state;
  - priority specs now point to implementation and primary tests;
  - `guides/reference/` is populated with role/status/route/XE lookup docs;
  - `scripts/audit-memory-bank.mjs` now enforces traceability coverage by default.
