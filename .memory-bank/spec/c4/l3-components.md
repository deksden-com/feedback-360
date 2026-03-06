# C4 L3 — Components (draft target)
Status: Updated (2026-03-06)

## Web App (Next.js)
- **Route handlers**: проверка auth + вызов операций Typed Client API.
- **UI pages**: рендер данных, формы, без бизнес-правил (валидация форм — только синтаксис, не доменные инварианты).
- **Webhook endpoints**: AI webhook, строгое соблюдение security spec.
- **Feature-area UI helpers**: `src/features/app-shell`, `src/features/identity-tenancy`, `src/features/campaigns`, `src/features/questionnaires`, `src/features/results`.
- **Compatibility shims**: исторические `src/lib/*`, `src/components/*`, `src/app/results/_shared.tsx` существуют только как thin re-export layer поверх feature-area модулей.

## Core
- **Use-cases**: create/update company data, campaign lifecycle, generate assignments, save/submit questionnaire, compute results, run AI job.
- **Policies**: anonymity threshold/merge rules, weight normalization, allowed transitions.
- **Ports**: DB, Mailer, Clock, Logger, JobScheduler, AIClient.

Target feature-area decomposition:
- `identity-tenancy`
- `org`
- `models`
- `campaigns`
- `matrix`
- `questionnaires`
- `results`
- `notifications`
- `ai`
- `shared` only for cross-area infrastructure/helpers without one obvious owner.

Implementation shape after EP-014:
- `packages/core/src/features/*.ts` — owning handlers per feature area.
- `packages/core/src/shared/context.ts` — shared operation context plumbing.
- `packages/core/src/index.ts` — thin dispatcher/composition point.

## Contract / client / CLI
- **API contract**: `packages/api-contract/src/<area>.ts` формируют feature-area public surface; `packages/api-contract/src/v1/legacy.ts` остаётся transitional implementation layer.
- **Typed client**: `packages/client/src/features/*.ts` формируют client methods per area; `packages/client/src/shared/runtime.ts` держит transport/runtime helpers; `packages/client/src/index.ts` only composes surface.
- **CLI**: `packages/cli/src/index.ts` остаётся thin entrypoint; `packages/cli/src/legacy.ts` временно содержит command wiring до дальнейшей декомпозиции по feature areas.

Детальные ownership boundaries и rationale:
- [Feature-area boundaries](../project/feature-area-boundaries.md): WHAT и target ownership rules.
- [ADR 0004 — Feature-area slicing boundaries](../../adr/0004-feature-area-slicing-boundaries.md): WHY именно такой decomposition.
