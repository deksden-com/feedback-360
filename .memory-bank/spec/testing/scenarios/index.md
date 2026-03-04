# Scenario catalog — index
Status: Draft (2026-03-03)

Цель: описать golden сценарии в виде “пошаговых тест-кейсов”, которые можно автоматизировать через CLI/client API.

- [GS1 Happy path](gs1-happy-path.md): сквозной путь indicators + lock + end + AI (MVP stub, webhook в full profile). Читать, чтобы покрыть базовую “нить” продукта.
- [GS2 Small group anonymity](gs2-small-group-anonymity.md): peers=2 → hide/merge + weight normalization. Читать, чтобы проверить ключевую privacy-грань.
- [GS3 Webhook security](gs3-webhook-security.md): HMAC + idempotency + retry semantics. Читать, чтобы webhook нельзя было подделать и повторы были безопасны.
- [GS4 Multi-tenant & RBAC (planned)](gs4-multi-tenant-rbac.md): изоляция компаний и права ролей. Читать, чтобы не открыть доступ “не тем”.
- [GS5 Lock semantics](gs5-lock-semantics.md): разрешено до lock и запрещено после. Читать, чтобы HR не мог менять матрицу/веса после первого draft save.
- [GS6 Started immutability (planned)](gs6-started-immutability.md): model/participants immutable после start. Читать, чтобы обеспечить честность процесса.
- [GS7 Notifications (planned)](gs7-notifications.md): outbox idempotency + timezone. Читать, чтобы не спамить и слать “в нужное время”.
- [GS8 Snapshot immutability (planned)](gs8-snapshot.md): изменения справочника после start не меняют кампанию. Читать, чтобы история была консистентной.
- [GS9 Levels rules (planned)](gs9-levels.md): mode/distribution + UNSURE + tie. Читать, чтобы levels работали “по отрасли”.
- [GS10 RLS smoke (planned)](gs10-rls.md): deny-by-default + service role. Читать, чтобы multi-tenant был защищён на уровне БД.
- [GS11 Matrix autogen (planned)](gs11-matrix-autogen.md): автогенерация по подразделениям и иерархии. Читать, чтобы матрица не была “рандомной”.
- [GS12 Campaign progress (planned)](gs12-campaign-progress.md): HR видит ход заполнения анкет. Читать, чтобы “прогресс кампании” был измеримым и пригодным для reminders.
- [GS13 Campaign invites (planned)](gs13-campaign-invites.md): invite письма при старте кампании через outbox без дублей. Читать, чтобы onboarding сотрудников был автоматизирован и идемпотентен.
