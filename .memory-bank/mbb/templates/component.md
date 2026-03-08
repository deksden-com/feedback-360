# Component template
Status: Template

Используй этот шаблон для L3-документов: component-level contracts, feature-area modules, screen families, automation surfaces, subsystem-internal modules.

```md
---
description: Кратко, что это за компонент и что внутри файла
purpose: Зачем читать этот документ и в каких задачах он нужен
status: Draft
date: YYYY-MM-DD
parent: <index or subsystem doc>
related_files:
  - <related spec>
  - <related ADR>
implementation_files:
  - <code file>
test_files:
  - <test file>
tags:
  - component
  - <area>
---

# <Component name>

## Purpose
Что это за компонент, где его границы, почему он существует.

## Responsibilities
- ...
- ...

## Inputs / outputs / contracts
Какие данные, события, операции или UI interactions сюда входят и выходят.

## Invariants
Что нельзя нарушать.

## Integration points
С чем этот компонент взаимодействует.

## Related implementation
Ссылки на ключевые implementation files и тесты.

## Related docs
Аннотированные ссылки на соседние документы.
```

## Когда применять

Подходит для:
- `spec/ui/screens/*`
- `spec/ui/pom/*`
- `spec/domain/*` на уровне одного модуля
- `spec/testing/*` на уровне одного механизма
- `spec/project/*`, если документ описывает конкретный component-level contract

## Обязательный минимум

В хорошем component doc должны быть:
- purpose и границы;
- список responsibilities;
- integration points;
- invariants;
- ссылки на код и тесты, если они уже существуют.
