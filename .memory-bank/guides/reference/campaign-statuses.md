---
description: Quick reference for campaign statuses and what they mean operationally.
purpose: Read when you need a fast explanation of campaign lifecycle states without opening full domain specs.
status: Active
date: 2026-03-09
parent: .memory-bank/guides/reference/index.md
---

# Campaign statuses — quick reference
Status: Active (2026-03-09)

## Statuses
- `draft` — кампания настраивается, оценки ещё не собираются.
- `started` — оценки разрешены, questionnaires may be saved/submitted.
- `ended` — questionnaires become read-only.
- `processing_ai` — post-processing is running.
- `ai_failed` — post-processing failed, retry is available.
- `completed` — results are ready.

## Important rules
- after `started`, model version and participant composition are no longer mutable;
- first questionnaire draft save locks matrix and weights at campaign level;
- after `ended`, questionnaire editing stops;
- AI statuses affect when final results become available.

## Related specs
- [Campaign lifecycle](../../spec/domain/campaign-lifecycle.md) — normative lifecycle and transition rules.
- [Questionnaires](../../spec/domain/questionnaires.md) — read-only and submit rules tied to campaign status.
