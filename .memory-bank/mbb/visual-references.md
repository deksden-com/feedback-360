# MBB — Visual references
Status: Draft (2026-03-06)

## Purpose
Визуальные референсы помогают быстрее проектировать UI, но не должны подменять собой требования, архитектуру и доменные инварианты.

## Storage rule
- Визуальные референсы храним в `.memory-bank/assets/ui/<source>/`.
- Для каждой коллекции референсов обязателен индекс в `.memory-bank/assets/ui/index.md` или более локальный `index.md`, где указаны provenance, целевое применение и ограничения.

## Provenance rule
Для каждого набора референсов фиксируем:
1) источник (`zip`, Figma export, design system dump, screenshot set),
2) дату появления в проекте,
3) статус (`reference only`, `approved visual direction`, `deprecated`),
4) какие эпики/фичи могут на него опираться.

## Non-SSoT rule
- Визуальные референсы **не являются SSoT** по поведению системы.
- Источник поведения — `spec/` и `plans/`.
- Если макет конфликтует с доменной спецификацией (анонимность, RBAC, freeze, lifecycle, raw/processed visibility), побеждает спецификация.

## Allowed usage
Из референсов можно брать:
- layout,
- визуальную иерархию,
- паттерны карточек/таблиц/фильтров,
- общую композицию экрана,
- navigation shell.

## Forbidden usage
Из референсов нельзя переносить без проверки:
- доменные тексты/правила,
- роли и permissions,
- статусы и transitions,
- кнопки/действия без существующего typed client API,
- чужой HTML/CSS/JS как production implementation.

## Link policy
- Все ссылки на visual refs в планах и UI spec должны быть аннотированными.
- В feature/epic планах рядом с референсом пишем, **что именно** из него берем и **чего не берем**.

## Evidence rule
- Скриншоты реализации фич идут в `.memory-bank/evidence/EP-XXX/FT-XXXX/YYYY-MM-DD/`.
- В FT/EP документах эти скриншоты вставляем как изображения `![...](...)`, а не только как plain links.
- Для user-facing/runtime фич manual verification на `beta` проходит через `$agent-browser` или Playwright с приложенными артефактами.

## Related SSoT
- [Documentation standards](../spec/engineering/documentation-standards.md): общие правила, где хранить WHAT/WHY/HOW и как не дублировать код документацией. Читать, чтобы visual refs не превращались в второй “spec layer”.
- [Stitch design mapping](../spec/ui/design-references-stitch.md): каталог текущих stitch-референсов и их маппинг на GUI-эпики. Читать, чтобы использовать уже зафиксированный reference set, а не создавать ad-hoc трактовки.
