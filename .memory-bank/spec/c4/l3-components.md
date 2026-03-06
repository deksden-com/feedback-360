# C4 L3 — Components (draft target)
Status: Draft (2026-03-03)

## Web App (Next.js)
- **Route handlers**: проверка auth + вызов операций Typed Client API.
- **UI pages**: рендер данных, формы, без бизнес-правил (валидация форм — только синтаксис, не доменные инварианты).
- **Webhook endpoints**: AI webhook, строгое соблюдение security spec.

После EP-014 web/lib modules дополнительно группируются по feature areas там, где это улучшает ownership; shared app shell и generic page-state wrappers остаются общими.

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

Детальные ownership boundaries и rationale:
- [Feature-area boundaries](../project/feature-area-boundaries.md): WHAT и target ownership rules.
- [ADR 0004 — Feature-area slicing boundaries](../../adr/0004-feature-area-slicing-boundaries.md): WHY именно такой decomposition.
