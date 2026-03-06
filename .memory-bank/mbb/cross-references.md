# MBB — Cross-references (code ↔ docs)
Status: Draft (2026-03-03)

Цель: поддерживать двустороннюю навигацию:
- из кода к архитектурной/фиче-спеке,
- из документации к реализации и тестам.

## Code → docs (target)
В JSDoc используем:
- `@docs` для основной документации компонента/слайса,
- `@see` для смежных документов, тестов, сценариев.

Для structural/ownership entrypoints это особенно важно:
- root composition files,
- slice entrypoints,
- shared modules with non-obvious scope.

Минимальный набор ссылок:
- WHAT-документ по области,
- WHY-документ (ADR), если граница или структура выбрана сознательно,
- смежный FT/verification document при сложной миграции.

## Docs → code (target)
В документации допускаются ссылки на файлы и строки (после появления кода).
Каждая ссылка должна быть аннотированной (что по ссылке + зачем читать).

Для index-first navigation это означает:
- индексы ведут не только на разделы документации, но и на ключевые target docs по boundaries/rationale;
- архитектурные документы после появления кода должны ссылаться на root composition points и owning implementation paths.
