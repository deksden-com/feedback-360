# EP-017 — Notification center UI
Status: Planned (2026-03-06)

## Goal
Дать HR/Admin визуальный контроль над reminder schedules, шаблонами и статусом доставки уведомлений.

## Scope
- In scope: reminder settings, templates preview, delivery/outbox diagnostics.
- Out of scope: Telegram delivery implementation; UI закладываем поверх email-first MVP.

## Features (vertical slices)
- [Feature catalog](features/index.md): FT-0171..FT-0173. Читать, чтобы notification subsystem стал управляемым через GUI, а не только через CLI и таблицы.

## Dependencies
- [EP-006 Notifications outbox (email)](../EP-006-notifications-outbox/index.md): outbox/idempotency/schedules. Читать, чтобы UI опирался на уже существующий messaging engine.
- [EP-012 HR campaigns UX](../EP-012-hr-campaigns-ux/index.md): часть notification controls будет жить в контексте campaign screens. Читать, чтобы navigation и ownership экранов были согласованы.

## Progress report (evidence-based)
- `as_of`: 2026-03-06
- `total_features`: 3
- `completed_features`: 0
- `evidence_confirmed_features`: 0
- verification link:
  - [Verification matrix](../../verification-matrix.md): здесь будут evidence reminder/template/delivery scenarios. Читать, чтобы операционный UI закрывался фактами, а не только состояниями на экране.

## Definition of done
- HR может настроить reminders и проверить status доставки без CLI.
- Preview и diagnostics согласованы с outbox/idempotency моделью.
- Для каждой фичи есть local acceptance и beta walkthrough.
