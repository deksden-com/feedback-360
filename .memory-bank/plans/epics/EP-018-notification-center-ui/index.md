# EP-018 — Notification center UI
Status: Completed (2026-03-06)

## Goal
Дать HR/Admin визуальный контроль над reminder schedules, шаблонами и статусом доставки уведомлений.

## Scope
- In scope: reminder settings, templates preview, delivery/outbox diagnostics.
- Out of scope: Telegram delivery implementation; UI закладываем поверх email-first MVP.

## Features (vertical slices)
- [Feature catalog](features/index.md): FT-0181..FT-0183. Читать, чтобы notification subsystem стал управляемым через GUI, а не только через CLI и таблицы.

## Dependencies
- [EP-006 Notifications outbox (email)](../EP-006-notifications-outbox/index.md): outbox/idempotency/schedules. Читать, чтобы UI опирался на уже существующий messaging engine.
- [EP-012 HR campaigns UX](../EP-012-hr-campaigns-ux/index.md): часть notification controls будет жить в контексте campaign screens. Читать, чтобы navigation и ownership экранов были согласованы.
- [EP-014 Feature-area slice refactor](../EP-014-feature-area-slices-refactor/index.md): target structure для `notifications` area и shared diagnostics modules. Читать, чтобы notification UI не закреплял legacy coupling.

## Progress report (evidence-based)
- `as_of`: 2026-03-06
- `total_features`: 3
- `completed_features`: 3
- `evidence_confirmed_features`: 3
- verification link:
  - [Verification matrix](../../verification-matrix.md): здесь зафиксированы local + beta evidence по reminder/template/delivery scenarios. Читать, чтобы операционный UI закрывался фактами, а не только состояниями на экране.

## Definition of done
- HR может настроить reminders и проверить status доставки без CLI.
- Preview и diagnostics согласованы с outbox/idempotency моделью.
- Для каждой фичи есть local acceptance и beta walkthrough.

## Current status
- Closed:
  - [FT-0181 Reminder schedule editor](features/FT-0181-reminder-schedule-editor/index.md): HR получил GUI для cadence, quiet hours и preview следующей отправки.
  - [FT-0182 Template catalog and preview](features/FT-0182-template-catalog/index.md): catalog шаблонов и preview письма работают через typed contract.
  - [FT-0183 Delivery diagnostics and outbox view](features/FT-0183-delivery-diagnostics/index.md): HR видит `sent` / `retry_scheduled` / `failed` и историю попыток в GUI.

## Completion note (2026-03-06)
- EP-018 закрыт полностью:
  - в `apps/web` появился `notifications-center` feature area и маршрут `/hr/notifications`;
  - typed client API и CLI получили операции settings/template-preview/delivery-diagnostics, чтобы GUI и CLI опирались на один контракт;
  - local quality gate и acceptance зелёные, beta acceptance подтверждён на `https://beta.go360go.ru`;
  - PR [#46](https://github.com/deksden-com/feedback-360/pull/46) смержен в `develop`, beta deployment подтверждён после merge commit `5218179`.
