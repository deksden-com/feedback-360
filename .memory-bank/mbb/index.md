# Memory Bank Bible (MBB) — Index
Status: Updated (2026-03-09)

`MBB` — это operating manual меморибанка `feedback-360`: как хранить SSoT, как не плодить дубли, как связывать документацию с кодом, тестами, UI traceability и сценариями.

## Что это покрывает

MBB отвечает за:
- структуру знаний в `.memory-bank/`;
- правила SSoT и декомпозиции;
- frontmatter и индексацию;
- traceability между docs, code, UI screens, screenshots, evidence;
- шаблоны документов для эпиков, фич и системных разделов.

## Core rules

- [Principles](principles.md): базовые правила меморибанка — SSoT, evidence-first completion, grounding-first, boundary rationale, screen IDs и design system как SSoT для repeated UI rules. Читать первым, чтобы понимать философию и обязательные инварианты работы с документами.
- [Indexing](indexing.md): как писать хорошие `index.md`, как выбирать глубину раскрытия и не оставлять orphan files. Читать при любом добавлении новых папок/документов и при обновлении навигации.
- [Frontmatter standards](frontmatter.md): когда frontmatter обязателен, какие поля использовать, как маркировать `screen_id`, `screen_ids`, epic/feature/scenario metadata. Читать при создании screen specs, guides, epic/feature docs и других машиночитаемых entrypoints.
- [Duo pattern](duo-pattern.md): как дробить большие темы на summary + detail without duplication. Читать, когда документ начинает “распухать” и уже плохо выполняет роль entrypoint.
- [C4 in docs](c4-in-docs.md): как раскладывать документы по уровням L1/L2/L3 и как это маппится на `spec/`, `plans/`, `guides/`. Читать, если тема стала архитектурно сложной или затрагивает несколько контейнеров/feature areas.
- [Cross-references](cross-references.md): как связывать код и документацию через JSDoc, file references и documentation entrypoints. Читать, когда нужно сделать docs <-> code traceability устойчивой.
- [Visual references](visual-references.md): как хранить HTML/mockups/screenshots как inspiration, а не как источник поведения. Читать перед добавлением новых UI референсов.

## Templates

- [Templates index](templates/index.md): каталог шаблонов и когда какой использовать. Читать перед созданием новых epic/feature/component/subsystem docs.
- [Epic template](templates/epic.md): шаблон эпика с progress/evidence, dependency map и delivery logic. Использовать для новых EP в `plans/`.
- [Feature template](templates/feature.md): шаблон feature vertical slice с grounding, scenarios, quality gates и CI/CD evidence. Использовать для новых FT.
- [Component template](templates/component.md): шаблон для component-level / feature-area level спецификаций. Использовать для устойчивых L3 docs, где важны contracts, invariants и integration points.
- [Subsystem template](templates/subsystem.md): шаблон для subsystem/container-level индексов. Использовать, когда нужно системно описать L2 зону и её карту документов.

## Project-specific adoption notes

- [Adoption from dd-flow](adoption-from-dd-flow.md): что мы переняли из более зрелого `dd-flow` MBB и как адаптировали это под `feedback-360`, без unnecessary ceremony. Читать, если хочется понять, почему наш MBB выглядит именно так, а не буквально копирует исходный проект.

## Практический порядок чтения

### Если создаёшь новый документ
1. `principles.md`
2. `indexing.md`
3. `frontmatter.md`
4. нужный template из `templates/`

### Если перерабатываешь большой раздел
1. `principles.md`
2. `duo-pattern.md`
3. `c4-in-docs.md`
4. `indexing.md`

### Если работаешь с UI docs / screenshots / guides
1. `principles.md`
2. `frontmatter.md`
3. `visual-references.md`
4. `cross-references.md`

## Что важно помнить

- MBB не должен дублировать `spec/` и `plans/`; он описывает правила игры, а не само продуктовое поведение.
- Если правило из MBB не помогает реальной работе с проектом — его нужно упростить, а не ритуально поддерживать.
- Если проект вырос, а MBB перестал покрывать реальные практики — MBB надо обновлять так же серьёзно, как и код.
