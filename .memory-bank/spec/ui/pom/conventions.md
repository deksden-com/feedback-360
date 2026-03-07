# POM conventions
Status: Draft (2026-03-07)

## Naming
- один экран = один основной page object;
- имя page object должно совпадать со screen spec по смыслу (`QuestionnaireFillPage`, `EmployeeResultsPage`).

## `data-testid`
- используем для ключевых интерактивных элементов и assertion targets;
- формат: `<area>.<screen>.<element>`;
- test ids должны быть стабильнее визуального layout.

## POM ↔ screen spec
Каждый POM должен ссылаться на свой screen spec, а screen spec — на соответствующий POM mapping document.

## Actor sessions
В XE automation:
- один actor = один storage state = один browser context;
- contexts не смешиваются между actors;
- GUI login не используется как обязательный bootstrap path.

## Scope
POM предоставляет high-level operations:
- open page
- perform action
- read visible state

POM не реализует доменную логику и не хранит expected business results внутри себя.
