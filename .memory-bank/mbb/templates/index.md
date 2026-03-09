# MBB Templates — Index
Status: Updated (2026-03-09)

Шаблоны нужны, чтобы новые документы в `feedback-360` сразу попадали в правильную структуру, были машиночитаемыми и не теряли traceability к коду, сценариям и evidence.

- [Epic template](epic.md): шаблон эпика с user value, scope, progress report, dependencies и evidence-based DoD. Использовать при создании новых `EP-*` в `plans/epics/`.
- [Feature template](feature.md): шаблон vertical slice фичи с grounding, implementation plan, acceptance, manual verification и CI/CD evidence. Использовать для новых `FT-*` документов.
- [Component template](component.md): шаблон component-level / feature-area spec. Использовать для устойчивых L3 документов, где важны contracts, invariants, integration points и links to implementation/tests.
- [Subsystem template](subsystem.md): шаблон subsystem/container-level index или overview. Использовать для L2 зон (`spec/ui/`, `spec/testing/`, `spec/operations/`, feature-area catalogs), где нужен единый entrypoint к группе документов.

## Как выбирать шаблон

- если документ описывает roadmap / delivery scope → `epic.md`
- если документ описывает один поставляемый slice → `feature.md`
- если документ описывает один компонент / экранную подсистему / feature area contract → `component.md`
- если документ объясняет крупную подсистему и навигацию по ней → `subsystem.md`
