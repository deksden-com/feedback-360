# Subsystem template
Status: Template

Используй этот шаблон для L2-документов и индексных файлов подсистем: когда нужно описать большую зону системы и провести читателя к её внутренним компонентам.

```md
---
description: Кратко, что это за подсистема / раздел и какие темы она покрывает
purpose: Зачем читать этот subsystem/index и когда он является entrypoint
status: Draft
date: YYYY-MM-DD
parent: <higher-level index>
children:
  - <child docs>
related_files:
  - <related subsystem or ADR>
tags:
  - subsystem
  - <area>
---

# <Subsystem name>

## Overview
Что это за подсистема, за что отвечает и почему она выделена отдельно.

## Boundaries
Что входит в scope, что не входит.

## Key documents
- [Doc A](...): что внутри. зачем читать.
- [Doc B](...): что внутри. зачем читать.

## Internal structure
Как внутри устроены компоненты / группы документов.

## Integration points
С какими соседними подсистемами есть основные связи.

## Reading path
С чего начать и куда идти дальше в зависимости от задачи.
```

## Когда применять

Подходит для:
- `spec/ui/index.md`
- `spec/testing/index.md`
- `spec/operations/index.md`
- `spec/project/index.md`
- крупных feature-area catalogs

## Обязательный минимум

В хорошем subsystem doc должны быть:
- overview и boundaries;
- карта ключевых документов;
- явная внутренняя структура;
- integration points;
- recommended reading path.
