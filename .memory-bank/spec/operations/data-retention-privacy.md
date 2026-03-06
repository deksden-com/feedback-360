# Data retention & privacy (MVP baseline)
Status: Approved (2026-03-06)

## Visibility
- Employee: никогда не видит raw-комментарии других людей; видит только агрегаты и AI-processed/summary текст с учётом anonymity policy.
- Manager: никогда не видит raw-комментарии; видит только team aggregates и AI-processed/summary текст по своим subject с учётом anonymity policy.
- HR Admin: видит raw + processed + summary open text, а также агрегаты и progress.
- HR Reader: read-only HR-витрина без raw open text; видит агрегаты, progress, processed и summary.

## Retention policy
### Campaign data
- Campaign metadata, assignments, snapshots, answers, aggregates, processed text и summary храним `24 months` после `campaign.completed_at` или `campaign.ended_at` (если AI не завершился).
- По истечении срока данные кампании подлежат удалению или архивированию по политике компании и отдельному operational runbook.

### Raw comments
- Raw open text хранится `180 days` после `campaign.completed_at` или `campaign.ended_at`.
- После истечения срока raw text должен быть удалён или необратимо очищен, при этом processed/summary и агрегаты могут оставаться в системе до завершения общего campaign retention.
- До внедрения автоматического purge это operational policy: проверка и очистка выполняются по runbook.

### Audit and ops data
- Audit trail по административным изменениям, webhook receipts, notification attempts и dispatch logs храним `180 days`.
- Sentry events и runtime logs храним в пределах retention, заданного внешним сервисом/платформой, но не дольше чем это необходимо для расследования инцидентов.

### Soft delete
- Soft delete на directory/org сущностях не должен немедленно уничтожать исторические campaign snapshots.
- Historical campaign snapshots и questionnaire data живут по campaign retention policy, даже если employee/department позже soft-deleted в справочнике.

## Operational notes
- MVP baseline не включает automated purge jobs; enforcement выполняется через operational review и documented cleanup steps.
- Если компания требует legal hold или более долгий retention, это отдельное policy decision вне текущего MVP baseline.
