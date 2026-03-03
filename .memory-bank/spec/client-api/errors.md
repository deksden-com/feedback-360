# Error model (contract/HTTP/CLI)
Status: Draft (2026-03-03)

## Error shape (SSoT)
Все операции возвращают машиночитаемую ошибку:
- `code`: стабильный строковый код (например, `campaign_locked`, `forbidden`, `invalid_transition`)
- `message`: человекочитаемое описание (RU на MVP допустимо)
- `details`: объект с полями для дебага/валидации (опционально)

## HTTP mapping (target)
- `400`: invalid input (schema)
- `401`: unauthenticated
- `403`: forbidden (RBAC / no membership)
- `404`: not found (в пределах company)
- `409`: conflict (lock/unique)
- `422`: domain validation failed
- `5xx`: unexpected / transient

## CLI mapping (target)
- По умолчанию human output, при `--json`:
  - `{"ok":false,"error":{code,message,details}}`
- `exitCode != 0` при `ok=false`.

## Standard error codes (MVP, SSoT)
Базовый набор кодов, которые используются в сценариях/фичах. Если появляется новый доменный код — добавляем его сюда.

- `invalid_input`: вход не проходит runtime-валидацию DTO (schema violation).
- `unauthenticated`: нет сессии/токена.
- `forbidden`: нет membership или роль не разрешена для операции.
- `not_found`: сущность не найдена в пределах активной компании (не раскрываем наличие в другой компании).

Domain (кампании/анкеты):
- `invalid_transition`: недопустимый переход статуса (state machine).
- `campaign_started_immutable`: попытка менять модель/participants после `started`.
- `campaign_locked`: после первого `questionnaire.saveDraft` нельзя менять матрицу/веса.
- `campaign_ended_readonly`: после `ended` нельзя сохранять/submit анкеты.

AI/Webhooks:
- `webhook_invalid_signature`: HMAC подпись неверна.
- `webhook_timestamp_invalid`: timestamp отсутствует/вне окна.
- `ai_job_conflict`: попытка запустить второй активный job без явного retry (если не делаем идемпотентный no-op).
