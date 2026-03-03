# GS13 — Campaign invites (magic link) (planned)
Status: Draft (2026-03-03)

## Setup
- Seed: `S4_campaign_draft`

## Action
1) HR стартует кампанию.
2) Проверить, что outbox содержит `campaign_invite` для получателей.
3) Повторить старт/ретрай и убедиться, что дублей нет.

## Assertions
- Outbox записи `campaign_invite` создаются ровно один раз на (campaign, recipient) (идемпотентность).
- Dispatcher отправляет письма (мок провайдера), attempts записываются.

## Client API ops (v1)
- `campaign.start`
- `notifications.dispatchOutbox`

