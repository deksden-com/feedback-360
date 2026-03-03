# Adoption notes — dd-flow MBB V6.0
Status: Draft (2026-03-03)

Источник: `../dd-flow/.memory-bank/mbb/` (MBB V6.0).

## Что там есть (конспект)
- **SSoT + атомарность + tier-based decomposition**: ориентиры по размеру документов и обязательная декомпозиция больших файлов.
- **C4-структурирование документации**: L1/L2/L3 по смыслу, папки в скобках `(packages)/` как meta-groups.
- **Duo files pattern**: обзорный файл + детальные файлы (architecture/implementation/api/examples).
- **Indexing guide**: shallow/deep/hybrid индексы и строгий формат аннотированных ссылок.
- **Frontmatter standards**: YAML метаданные (description/purpose/version/date/status/parent/children/tags/history).
- **Cross-references**: JSDoc `@docs/@see` и ссылки документация→код.
- **Templates**: subsystem/component/epic/feature шаблоны.

## Что берём в feedback-360 (без оверинжиниринга)
- Обязательное: SSOT, атомарность, progressive disclosure, индексы + аннотированные ссылки, duo pattern.
- Рекомендуемое позже: cross-references (когда появится код и станет полезна трассировка).
- Опционально позже: YAML frontmatter и автоматическая валидация (когда документации станет достаточно много, чтобы окупилось).

