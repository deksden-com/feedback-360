# MBB — Principles
Status: Draft (2026-03-03)

## 1) Single Source of Truth (SSoT)
Каждая концепция/правило имеет **один** нормативный документ. Если нашли дубль — объединяем, оставляя один источник и ссылки на него.

## 2) One file = one concept (атомарность)
Один файл описывает одну тему. Если тема становится слишком широкой — разбиваем на несколько файлов и связываем через `index.md` или обзорный файл (см. duo pattern).

## 3) Progressive disclosure
Сначала обзор и ключевые решения, затем ссылки “углубиться”. Документы читаются сверху вниз: от общего к частному.

## 4) WHY vs WHAT vs HOW
- `spec/` — WHAT (норматив: как система должна работать).
- `guides/` — user-facing docs: tutorials/how-to/explanation/reference (как системой пользоваться и как объяснять её поведение людям).
- `adr/` — WHY (почему приняли такое решение).
- `plans/` — как делаем по шагам (что в каком порядке и как проверяем).
Код — HOW (детали реализации), и не должен копироваться в меморибанк (кроме ссылок).

Для structural refactor и code-organization решений это правило применяется жёстко:
- target boundaries, ownership rules и invariants — в `spec/`,
- rationale выбора именно этих boundaries — в `adr/`,
- шаги миграции и проверки — в `plans/`,
- concrete files/imports/entrypoints — в коде с cross-links.

## 5) No duplication with code
Не копируем в меморибанк “названия таблиц/полей/файлов” как единственную ценность. Если нужно — даём ссылку на код/миграции и фиксируем смысл/инварианты (почему так, какие гарантии).

## 6) Index-first navigation
Новые документы должны появляться в индексе соответствующей папки. Orphan файлы без входной ссылки считаем дефектом.

Для новых UI/XE документов это правило применяется явно:
- новые `spec/ui/screens/*` и `spec/ui/pom/*` документы обязаны быть добавлены в `spec/ui/index.md` и соответствующий подиндекс;
- новые `plans/xe/*` и `spec/testing/xe-*` документы обязаны быть добавлены в `plans/index.md`, `plans/xe/index.md` или `spec/testing/index.md`.
- новые `guides/*` документы обязаны быть добавлены в `guides/index.md` и индекс соответствующего Diátaxis-раздела (`tutorials/`, `how-to/`, `explanation/`, `reference/`).

## 7) Annotated links (обязательное правило)
Каждая ссылка в markdown должна быть аннотирована:
1) 1–2 предложения “что по ссылке”.
2) 1–2 предложения “зачем читать / что это даст”.

## 8) Keep documents small
Стараться удерживать документы компактными. Когда документ становится трудно читать/поддерживать — применяем duo pattern и/или подиндексы.

## 9) Commit tagging for traceability (обязательное правило)
Коммиты/PR, связанные с реализацией фич/эпиков из плана, должны быть трассируемыми (обязательный тег `[FT-*]`/`[EP-*]`, ссылки на FT/EP документы, evidence).

SSoT правил ветвления/commit convention/PR/evidence:
- [Git flow](../spec/operations/git-flow.md): правила веток, PR, traceability и release-путь `feature/* -> develop -> main`. Читать, чтобы реализация и релиз шли по одному процессу и без “ручных обходов”.
- [Delivery standards](../spec/engineering/delivery-standards.md): обязательный acceptance gate и формат фиксации доказательств для закрытия фич. Читать, чтобы статус `Completed` всегда подтверждался проверками.

Это правило нужно, чтобы по `git log` можно было быстро связать код, план и acceptance-сценарии без ручного расследования.

## 10) Evidence-first completion (обязательное правило)
Фича не переводится в `Completed`, пока:
1) не пройден отдельный quality gate (`pnpm checks` как preferred workspace gate; при необходимости `pnpm test:db` / `pnpm test:db:full`),
2) после реализации фичи не прогнан её acceptance-сценарий и обязательные GS,
3) не записаны доказательства выполнения (команды/результаты/дата) в memory bank,
4) если менялись планы/статусы/evidence — не пройден memory-bank audit (`pnpm docs:audit` или эквивалент для целевого эпика).

Для user-facing/runtime фич evidence включает browser-smoke на целевом окружении через `$agent-browser` (с артефактами скриншотов по шагам сценария).

## 11) Root index usefulness (обязательное правило)
`.memory-bank/index.md` должен содержать не только ссылки на папки, но и curated ссылки на критичные документы на 2–3 уровня вниз (quick-start для агента).

Подробные правила отбора и структуры главного индекса:
- [Indexing](indexing.md): стратегия `Quick start + Key folders + important docs`, правило partial disclosure на 2–3 уровня и критерии “что важно”. Читать при обновлении главного индекса, чтобы он оставался полезным и не превращался в “дамп ссылок”.

## 12) Grounding-first implementation (обязательное правило)
Перед любыми изменениями в коде по FT агент обязан пройти `Project grounding`:
1) прочитать FT и её SSoT ссылки контекста,
2) свериться с operation/CLI каталогами и traceability,
3) зафиксировать в FT, что именно прочитано и какие слои затрагиваются.

Фича не должна уходить в реализацию “по памяти” или по старым предположениям: grounding — часть DoD и проверяется на ревью.

## 13) Visual references are inspiration, not behavior
UI mockups, screenshots и HTML-экспорты:
- храним в `.memory-bank/assets/ui/`,
- индексируем и снабжаем provenance,
- используем только как visual/layout reference.

SSoT поведения системы остаётся в `spec/` и `plans/`. Если референс конфликтует с доменной спецификацией, выигрывает спецификация.

Связанные правила:
- [Visual references](visual-references.md): где хранить макеты, как их аннотировать и что из них можно/нельзя брать. Читать перед добавлением новых UI источников.
- [Stitch design mapping](../spec/ui/design-references-stitch.md): текущий каталог `stitch_go360go` и его привязка к GUI-эпикам. Читать перед планированием или реализацией GUI, чтобы все агенты опирались на один и тот же набор референсов.

## 15) UI specs and POM mapping are first-class documentation
Для экранов, которыми управляют acceptance/XE/browser automation:
- screen spec хранится в `.memory-bank/spec/ui/screens/`;
- POM mapping и automation conventions хранятся в `.memory-bank/spec/ui/pom/`;
- screen spec описывает смысл и contract экрана;
- POM mapping описывает stable ids, page object surface и связь с automation layer;
- сценарии и фазы ссылаются на screen specs/POM, а не дублируют их.

Это нужно, чтобы GUI мог эволюционировать без потери тестируемости и без расхождения между UX-доками и automation.

## 14) Boundary rationale must be documented
Если проект вводит новые архитектурные границы (feature areas, shared modules, root composition points, subsystem ownership), меморибанк обязан отвечать на два вопроса:
1) **что** является границей и где она проходит,
2) **почему** граница проведена именно так.

Минимум для таких изменений:
- `spec/*` документ с target boundaries и ownership rules,
- `adr/*` документ с rationale,
- кросс-ссылки из индексов и связанных implementation/playbook документов,
- docs ↔ code navigation для ключевых entrypoints.

Идея простая: агент не должен восстанавливать архитектурный смысл “по git blame” или по структуре папок.
