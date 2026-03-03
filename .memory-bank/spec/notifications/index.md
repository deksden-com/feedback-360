# Notifications Index
Status: Draft (2026-03-03)

- [Notification spec](notifications.md) — события, триггеры, расписания, идемпотентность/outbox. Читать, чтобы нотификации не дублировались и работали в таймзоне компании.
- [Templates RU v1](templates-ru-v1.md) — каталог шаблонов и переменных. Читать, чтобы добавлять/версионировать шаблоны без слома рассылок.
- [Telegram MVP placeholder](telegram-mvp-placeholder.md) — какие данные храним под Telegram и что не делаем в MVP. Читать, чтобы не потерять Telegram-готовность и не пытаться реализовать канал раньше времени.
- [Localization & template versioning](localization.md) — как закладываем RU-only MVP и возможность расширения на EN без перестройки. Читать, чтобы шаблоны и данные были готовы к мульти-языку, но MVP оставался простым.
- [Outbox & retries](outbox-and-retries.md) — правила идемпотентности, ретраев и dead-letter для отправки уведомлений. Читать, чтобы рассылка была надёжной и не спамила дублями.
