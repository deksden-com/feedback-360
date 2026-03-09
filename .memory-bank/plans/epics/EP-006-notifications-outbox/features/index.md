---
description: Feature catalog for EP-006-notifications-outbox.
purpose: Read to see the slice breakdown inside the epic and navigate to individual feature plans.
status: Completed
date: 2026-03-09
parent: .memory-bank/plans/epics/EP-006-notifications-outbox/index.md
epic: EP-006
---


# EP-006 — Feature catalog
Status: Completed (2026-03-05)

- [FT-0061 Outbox schema + dispatcher](FT-0061-outbox-dispatcher/index.md): outbox/attempts + отправка через Resend. **Completed (2026-03-05)**. Читать, чтобы отправка была надёжной.
- [FT-0062 Idempotency + retries](FT-0062-idempotency-retries/index.md): отсутствие дублей + политика ретраев/dead-letter. **Completed (2026-03-05)**. Читать, чтобы не спамить и не терять письма.
- [FT-0063 Scheduling (timezone + quiet hours)](FT-0063-scheduling/index.md): когда генерируем reminders и как учитываем таймзону. **Completed (2026-03-05)**. Читать, чтобы “слать вовремя”.
- [FT-0064 Campaign start invites (magic links)](FT-0064-campaign-invites/index.md): приглашения при старте кампании (email-only MVP) через outbox. **Completed (2026-03-05)**. Читать, чтобы “первый вход” сотрудников был автоматизирован и идемпотентен.
