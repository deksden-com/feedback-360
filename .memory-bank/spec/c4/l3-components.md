# C4 L3 — Components (draft target)
Status: Draft (2026-03-03)

## Web App (Next.js)
- **Route handlers**: проверка auth + вызов операций Typed Client API.
- **UI pages**: рендер данных, формы, без бизнес-правил (валидация форм — только синтаксис, не доменные инварианты).
- **Webhook endpoints**: AI webhook, строгое соблюдение security spec.

## Core
- **Use-cases**: create/update company data, campaign lifecycle, generate assignments, save/submit questionnaire, compute results, run AI job.
- **Policies**: anonymity threshold/merge rules, weight normalization, allowed transitions.
- **Ports**: DB, Mailer, Clock, Logger, JobScheduler, AIClient.

