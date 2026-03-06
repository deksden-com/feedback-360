# Project Index
Status: Draft (2026-03-03)

- [System overview](system-overview.md) — что за продукт, для кого, какие ключевые свойства (multi-tenant, best practices 360). Читать, чтобы быстро онбордиться и не терять фокус.
- [Stack & tooling](stack-and-tooling.md) — стек и инструменты. Читать, чтобы реализация соответствовала принятым технологиям.
- [MVP scope](mvp-scope.md) — что делаем в MVP и что откладываем. Читать, чтобы отсекать лишнее.
- [Non-goals](non-goals.md) — сознательно не делаем на MVP. Читать, чтобы не появлялись скрытые ожидания.
- [Layers & vertical slices](layers-and-vertical-slices.md) — как одновременно держим слои и делаем фичи вертикальными. Читать, чтобы код не превратился в “слоёный пирог без фич” или “фичи без правил”.
- [Repo structure (target)](repo-structure.md) — рекомендуемая структура монорепо и границы пакетов. Читать, чтобы слои были соблюдены и vertical slices “сшивались” через контракт и client.
- [Feature-area boundaries](feature-area-boundaries.md) — target ownership boundaries между `campaigns/results/questionnaires/...` и правила для `shared`. Читать перед structural refactor и новыми slices, чтобы понимать не только layout, но и rationale распределения кода.
