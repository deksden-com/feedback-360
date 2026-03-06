# FT-0172 — Template catalog and preview
Status: Planned (2026-03-06)

## User value
HR понимает, какие письма отправляет система и что увидит сотрудник до старта кампании.

## Deliverables
- Template list.
- Preview screen with sample data.
- Variables list and locale/version metadata.

## Context (SSoT links)
- [Templates RU v1](../../../../../spec/notifications/templates-ru-v1.md): canonical template set. Читать, чтобы preview corresponded to the real templates.
- [Localization](../../../../../spec/notifications/localization.md): current RU-only scope and future locale expansion. Читать, чтобы UI не обещал лишнее.
- [Stitch mapping — EP-017](../../../../../spec/ui/design-references-stitch.md#ep-017--notification-center-ui): generic admin patterns only.

## Project grounding
- Проверить current template metadata and available placeholders.
- Свериться with user-facing wording in glossary/spec.

## Implementation plan
- Build template catalog and preview panel.
- Show variables and version labels.
- Mark unsupported locales explicitly.

## Scenarios (auto acceptance)
### Setup
- Seed: notifications template metadata fixtures.

### Action
1. Open template catalog.
2. Select `campaign_invite` / `campaign_reminder`.
3. Inspect preview and variables.

### Assert
- Preview uses canonical template metadata.
- Variables list accurate.
- Locale support clearly labeled.

### Client API ops (v1)
- Template catalog/preview ops.

## Manual verification (deployed environment)
- `beta`: open template preview and compare expected wording/variables before sending a campaign.

## Docs updates (SSoT)
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md)
