# Domain Index
Status: Draft (2026-03-03)

- [Campaign lifecycle](campaign-lifecycle.md) — статусы, переходы, freeze-правила. Читать, чтобы реализовать state machine и запреты на изменения.
- [Assignments & matrix](assignments-and-matrix.md) — назначение оценщиков, автогенерация по оргструктуре и ограничения на изменения. Читать, чтобы корректно “кто кого оценивает” работало и было тестируемо.
- [Org structure & snapshots](org-structure.md) — оргданные и снапшот на старт кампании. Читать, чтобы автогенерация назначений и история были консистентны.
- [Questionnaires](questionnaires.md) — анкеты, draft/submit, правила редактирования. Читать, чтобы корректно хранить ответы и прогресс.
- [Competency models](competency-models.md) — версии модели и два вида шкал (indicators/levels). Читать, чтобы кампании не ломались при изменениях модели.
- [Calculations](calculations.md) — формулы и агрегации (numbers + distributions). Читать, чтобы результаты считались одинаково везде.
- [Anonymity policy](anonymity-policy.md) — пороги, скрытие/слияние групп, правила показа текста. Читать, чтобы не допустить deanonymization.
- [Soft delete & history](soft-delete-and-history.md) — is_active/deleted_at и историзация оргданных. Читать, чтобы удаление/перемещения сотрудников не ломали активные кампании.
- [Results visibility](results-visibility.md) — кто что видит (HR/manager/employee), особенно по open text. Читать, чтобы UI/API не нарушали приватность.

