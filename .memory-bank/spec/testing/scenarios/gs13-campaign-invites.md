# GS13 — Campaign invites (magic link)
Status: Active (2026-03-05)

## Setup
- Seed: `S4_campaign_draft`

## Action
1) HR стартует кампанию.
2) Проверить, что outbox содержит `campaign_invite` для получателей.
3) Повторить старт/ретрай и убедиться, что дублей нет.

## Assertions
- Outbox записи `campaign_invite` создаются ровно один раз на (campaign, recipient) (идемпотентность).
- Dispatcher отправляет письма (мок провайдера), attempts записываются.

Примечание по покрытию:
- Сценарий закрыт FT-0064 (integration + dispatcher path).

## Client API ops (v1)
- `campaign.start`
- `notifications.dispatchOutbox`
