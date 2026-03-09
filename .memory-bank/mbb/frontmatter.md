# MBB — Frontmatter standards
Status: Updated (2026-03-09)

`Frontmatter` в `feedback-360` нужен не ради красоты, а ради машиночитаемости, навигации и impact analysis. Мы не требуем тотальный retroactive migration всех markdown-файлов, но для важных классов документов frontmatter уже должен быть стандартом.

## Где frontmatter обязателен

### Обязательно
- `spec/ui/screens/*.md`
- `guides/tutorials/*.md`
- `guides/how-to/*.md`
- `guides/explanation/*.md`, если в документе есть walkthrough/screenshots
- `plans/epics/**/index.md`
- `plans/xe/**/index.md`
- документы, где важны `screen_id` / `screen_ids`

### Сильно рекомендуется
- `spec/ui/design-system/*.md`
- `spec/testing/xe-*.md`
- крупные `spec/*` и `adr/*`, если они уже выполняют роль SSoT entrypoint

### Опционально
- очень маленькие заметки;
- внутренние шаблоны и вспомогательные файлы, где frontmatter не даёт дополнительной пользы.

## Базовые поля

Минимальный набор, когда frontmatter используется:

```yaml
---
description: Кратко, что внутри документа
purpose: Зачем этот файл читать и что это даст
status: Draft | Active | Deprecated
date: YYYY-MM-DD
---
```

### Правила
- `description` — что находится внутри, 1–2 предложения
- `purpose` — зачем это читать, 1–2 предложения
- `status` — только нормализованное значение (`Draft`, `Active`, `Deprecated`, `Template`)
- `date` — дата последнего значимого обновления

Если документ одновременно хранит и YAML `status:`, и видимую строку `Status: ...` в теле файла, **frontmatter считается каноническим**, а видимая строка обязана ему соответствовать по смыслу.

## Навигационные поля

Используем, когда документ реально встроен в иерархию:

```yaml
parent: .memory-bank/spec/ui/index.md
children:
  - screen-a.md
  - screen-b.md
related_files:
  - .memory-bank/spec/ui/screen-registry.md
```

### Когда это полезно
- у индексов;
- у subsystem/component-level документов;
- у документов, которые являются canonical entrypoint для темы.

## Поля для UI traceability

### Для screen specs

```yaml
screen_id: SCR-HR-EMPLOYEES
route: /hr/employees
actors:
  - hr_admin
  - hr_reader
test_id_scope: scr-hr-employees
pom: POM-HR-EMPLOYEES
```

### Для guides/tutorials/how-to

```yaml
screen_ids:
  - SCR-AUTH-LOGIN
  - SCR-HR-EMPLOYEES
  - SCR-HR-ORG
```

Если документ использует screenshots по экрану, `screen_id` / `screen_ids` должны быть согласованы с `screen-registry.md`.

## Поля для plans

Для epic/feature/scenario документов допустим такой слой:

```yaml
epic: EP-021
feature: FT-0214
scenario: XE-001
```

Не обязательно везде, но это полезно, когда документ участвует в traceability между планом, кодом, evidence и guides.

## Поля версионности и истории

Если документ долгоживущий и часто меняется, можно добавлять:

```yaml
version: 1.2.0
history:
  - version: 1.2.0
    date: 2026-03-09
    changes: Expanded frontmatter policy for UI traceability
```

Это полезно для больших стандартов и шаблонов, но не нужно навязывать каждому небольшому guide.

## Поля категоризации

Допустимы:

```yaml
tags:
  - ui
  - testing
  - xe
  - screen-spec
```

Теги должны помогать поиску, а не становиться шумом. Лучше 3–6 осмысленных тегов, чем длинный список.

## Чего не делать

- Не дублировать в frontmatter весь смысл документа.
- Не превращать frontmatter в огромную YAML-форму, если он не даёт пользы.
- Не использовать неочевидные локальные статусы (`WIP`, `In progress`, `old`).
- Не писать абсолютные пути из локальной машины.

## Формат статусов

Рекомендуемый канонический набор:
- `Draft`
- `Active`
- `Deprecated`
- `Template`

Если файл — historical artifact, лучше перевести его в архивный раздел, чем придумывать ещё один статус.

## Связь с индексами и шаблонами

Если мы ввели frontmatter для типа документа, это должно отражаться:
- в соответствующем шаблоне из `mbb/templates/`;
- в индексе папки, где этот тип живёт;
- в правилах автоматизации, если документ участвует в validation/audit.

## Практический принцип

Для `feedback-360` frontmatter — это не цель, а усилитель полезности документа. Используем его везде, где он помогает:
- быстрее понять файл;
- автоматически связать его с экраном/эпиком/сценарием;
- ускорить impact analysis и обновление evidence.

Отдельное правило: если документ участвует в traceability между docs, кодом и tests, frontmatter должен поддерживать эту трассировку, а не мешать ей смешанными или противоречивыми полями.
