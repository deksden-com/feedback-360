# How `XE-001` works
Status: Draft (2026-03-07)

Этот документ объясняет `XE-001` как end-to-end сценарий продукта.

Главный сценарный источник:

- [`scenarios/XE-001/how-it-works.md`](../../../scenarios/XE-001/how-it-works.md): полный визуальный walkthrough по шагам с screenshots и пояснениями. Читать, чтобы увидеть сам сценарий как историю от setup до results.

Машиночитаемые и сценарные материалы:

- [`scenarios/XE-001/scenario.json`](../../../scenarios/XE-001/scenario.json): декларативный каркас фаз сценария. Читать, если нужен machine-readable контур run-а.
- [`scenarios/XE-001/fixtures/answers.json`](../../../scenarios/XE-001/fixtures/answers.json): fixture ответов участников. Читать, если нужно понять источник агрегатов и результатов.
- [`scenarios/XE-001/fixtures/expected-results.json`](../../../scenarios/XE-001/fixtures/expected-results.json): expected outcome сценария. Читать, если нужно увидеть, что именно считается корректным результатом.

## Ключевое различие

`XE-001` — это **не manual UI tutorial**.

В нём:

- setup данных делает runner;
- notification/bootstrap делает runner;
- UI используется для входа и проверки результатов.

Это помогает держать сценарий воспроизводимым и не путать golden run с ручной демонстрацией продукта.
