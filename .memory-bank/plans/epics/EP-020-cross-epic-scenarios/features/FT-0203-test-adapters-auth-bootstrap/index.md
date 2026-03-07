# FT-0203 — Test adapters and auth bootstrap
Status: Draft (2026-03-07)

Пользовательская ценность: сценарий может проверять notification intents и быстро логинить actors без внешней почты/Telegram и без ручного GUI-login.

Deliverables:
- notification test adapter
- controlled async stubs for XE
- short-lived test-only auth bootstrap for `local`/`beta`
- audit trail for token/session issuance

Acceptance scenario:
- campaign start создаёт notification intents в test adapter
- раннер может получить auth bootstrap для `subject`
- браузер получает обычную session и открывает защищённый экран
- logout завершает текущую session обычным путём
