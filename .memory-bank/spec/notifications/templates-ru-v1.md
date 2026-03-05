# Templates catalog (RU v1)
Status: Draft (2026-03-03)

Шаблоны версионируются. MVP язык: RU-only, но структура позволяет добавить другие языки позже.

MVP keys:
- `campaign_invite@v1`
  - vars (current implementation): `campaignName`, `recipientEmployeeId`, `invitedAt`
  - note: magic-link URL будет добавлен отдельным слайсом auth/invite plumbing; текущий MVP-текст приглашает войти в систему.
- `campaign_reminder@v1`
  - vars (current implementation): `campaignName`, `recipientEmployeeId`, `pendingCount`, `dateBucket`, `timezone`
