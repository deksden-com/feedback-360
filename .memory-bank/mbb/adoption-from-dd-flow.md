# Adoption notes — dd-flow MBB V6.0
Status: Updated (2026-03-09)

Источник: `../dd-flow/.memory-bank/mbb/`.

Этот файл нужен не для буквального копирования чужого MBB, а чтобы честно фиксировать: какие зрелые практики мы уже перенесли в `feedback-360`, что адаптировали под свой контекст, а что сознательно не тащим.

## Что взяли практически целиком

- **SSoT + атомарность + progressive disclosure** — это базовая философия нашего меморибанка.
- **Tier-based decomposition / duo pattern** — теперь оформлено отдельным operational guide, а не короткой заметкой.
- **C4 как каркас документации** — используем на уровнях L1/L2/L3 и явно маппим на `spec/`, `plans/`, `guides/`.
- **Индексирование через annotated links** — сохранили и усилили правила entrypoint-индексов.
- **Шаблоны epic/feature** — взяли как базу и адаптировали под vertical slices, XE, quality gates и evidence.
- **Шаблоны component/subsystem** — добавили в `feedback-360`, потому что проект уже дорос до этого уровня структурности.

## Что адаптировали под `feedback-360`

- **Frontmatter** — не вводим тотальную обязательность на весь архив markdown, но для UI/guides/plans и других машиночитаемых entrypoints делаем его стандартом.
- **C4** — привязываем не к абстрактному `docs/`, а к нашим реальным разделам `spec/`, `guides/`, `plans/`, `adr/`.
- **Templates** — упростили формулировки и привязали к нашему delivery cycle (`screen_id`, `XE`, `verification matrix`, `manual beta checks`).
- **UI-specific traceability** — это уже наш проектный слой сверх `dd-flow`: `screen_id`, `testIdScope`, screenshot naming, POM mapping, design system sync.

## Что сознательно НЕ переносим как обязательный ритуал

- тотальную frontmatter-миграцию всех старых файлов прямо сейчас;
- heavy metadata ради metadata;
- избыточные поля и ceremony там, где документ остаётся маленьким и атомарным;
- шаблоны ради шаблонов, если файл не играет роль reusable entrypoint.

## Текущая стратегия

Мы переносим из `dd-flow` не объём текста, а полезную зрелость:
- усиливаем `mbb/` там, где проект уже действительно сложный;
- не вводим правила, которые не улучшают поиск, traceability или delivery quality;
- оставляем MBB проектным инструментом, а не бюрократическим слоем.

## Практический итог

После обновления `mbb/` в `feedback-360` мы приблизились к зрелости `dd-flow` в частях, которые реально нужны нашему проекту:
- frontmatter standards;
- richer indexing guide;
- полноценный duo/C4 guide;
- subsystem/component templates;
- сильный `mbb/index` как operating manual.

Если в будущем проект снова перерастёт текущий MBB, этот файл должен обновляться вместе с ним: как честная карта того, что именно мы переняли и почему.
