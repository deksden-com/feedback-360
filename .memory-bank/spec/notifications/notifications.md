# Notification spec (email MVP)
Status: Active (2026-03-05)

Каналы:
- MVP: `email` (Resend).
- Telegram: позже (в MVP только данные/поля).

## Events (MVP)
- `campaign_invite`: при включении сотрудника/оценщика в кампанию и/или при старте кампании (MVP: достаточно при старте, но событие фиксируем как доменное).
- `campaign_started`: уведомление о старте оценки (может быть объединено с invite).
- `campaign_reminder`: по расписанию до `end_at`, если у человека есть не-submitted анкеты.
- `campaign_results_ready`: после `completed` (опционально для MVP; можно включить позже).

## Scheduling
MVP default:
- 3 раза в неделю в 10:00 по таймзоне кампании (company timezone с override на кампанию).
- Quiet hours: не отправлять вне 08:00–20:00 локального времени кампании.
- Дни расписания по умолчанию: Пн/Ср/Пт.

## Outbox & idempotency
- Все уведомления создаются как записи в outbox.
- Для reminders idempotency key включает: `campaign_id`, `event_type`, `recipient_employee_id`, `date_bucket`.
- Для invites idempotency key включает: `campaign_id`, `event_type`, `recipient_employee_id`.
- `date_bucket` для reminders вычисляется по **локальной дате таймзоны кампании** (не UTC).

## Invite recipients (MVP)
- На `campaign.start` получатели invite формируются как union:
  - `campaign_participants.employee_id`
  - `campaign_assignments.rater_employee_id`
  - `campaign_assignments.subject_employee_id`
- Отправка только активным сотрудникам (`employees.is_active=true`).

## Invite content (agreed)
Invite/started уведомления содержат magic-link для входа:
- так как `User` создаётся заранее HR Admin’ом, magic-link используется как способ входа, а не “публичная регистрация”.
- доступ разрешён только если email присутствует в HR-справочнике (см. auth spec).
