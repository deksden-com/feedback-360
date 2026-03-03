# FT-0023 — RLS deny-by-default + service role contours
Status: Draft (2026-03-03)

## User value
Multi-tenant защищён на уровне БД; cron/outbox/webhooks работают через service role.

## Deliverables
- RLS политики “deny by default” + allow через membership claims.
- Service role используется только на сервере для cron/outbox/webhooks.

## Context (SSoT links)
- [RLS strategy](../../../../../spec/security/rls.md): как включаем RLS, какие claims используем и где нужен service role. Читать, чтобы RLS был реальным барьером, а не “формально включили”.
- [Auth & identity](../../../../../spec/security/auth-and-identity.md): users/memberships и signups off. Читать, чтобы RLS связывался с реальным `user_id` и membership.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): чеклист “FT → код”. Читать, чтобы RLS проверялся integration тестами и не ломал ранние vertical slices.

## Acceptance (auto)
### Setup
- Seed: `S1_multi_tenant_min`.

### Action (integration test)
1) Под обычной user session (JWT) попытаться прочитать строку/таблицу company B.
2) Под service role ключом прочитать ту же строку/таблицу.

### Assert
- (1) запрещено RLS (ошибка доступа).
- (2) разрешено (server-only контур).

## Implementation plan (target repo)
- Политика:
  - Включить RLS на основных таблицах с `company_id`.
  - По умолчанию “deny”; разрешить `SELECT/INSERT/UPDATE` только если `exists membership(user_id, company_id)`.
  - Для cron/outbox/webhooks использовать service role (server-only env var), не прокидывать его в клиентов.
- Тонкие моменты:
  - Тесты должны различать “запрещено RLS” и “не найдено” (для безопасности можно маппить наружу в `not_found`, но внутри теста важно знать, что RLS работает).
  - Список таблиц под RLS расширять постепенно (не ломая ранние эпики).

## Tests
- Integration (GS10): user JWT не может читать чужую компанию; service role может.

## Memory bank updates
- При изменении набора таблиц/политик обновить: [RLS strategy](../../../../../spec/security/rls.md) — SSoT RLS. Читать, чтобы эксплуатация (runbook) и безопасность не расходились.

## Verification (must)
- Automated test: `packages/db/test/ft/ft-0023-rls-smoke.test.ts` (integration) проверяет user JWT vs service role доступ.
- Must run: GS10 (RLS smoke) должен быть зелёным.
