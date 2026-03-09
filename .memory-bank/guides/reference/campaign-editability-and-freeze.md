---
description: Quick reference for what can still be edited in a campaign and when freeze rules apply.
purpose: Read when you need the shortest answer about draft/start/lock/end mutability without opening deep domain specs.
status: Active
date: 2026-03-09
parent: .memory-bank/guides/reference/index.md
screen_ids:
  - SCR-HR-CAMPAIGNS
  - SCR-HR-CAMPAIGN-DETAIL
  - SCR-HR-CAMPAIGN-EDIT
  - SCR-HR-CAMPAIGN-MATRIX
---

# Campaign editability and freeze — quick reference
Status: Active (2026-03-09)

## Before start (`draft`)
- HR can change campaign dates, model version, participants, matrix, reminders, and weights.
- Draft campaign remains the only state where structural setup is fully mutable.

## After start (`started`)
- model version and participant composition are frozen;
- questionnaires become available;
- reminders can still run;
- matrix and weights remain editable only until the first questionnaire `draft save`.

## After first draft save (`locked_at`)
- campaign-level matrix and effective weight setup are frozen;
- this lock is triggered by the first saved questionnaire draft, not only by submit.

## After end (`ended`)
- questionnaires become read-only;
- results can be processed and reviewed;
- no further questionnaire editing is allowed.

## Related specs
- [Campaign lifecycle](../../spec/domain/campaign-lifecycle.md) — normative transition and mutability rules.
- [Questionnaires](../../spec/domain/questionnaires.md) — questionnaire draft/save/submit/read-only behavior.
- [HR campaign detail screen](../../spec/ui/screens/hr-campaign-detail.md) — current operational surface where these rules are exposed in UI.
