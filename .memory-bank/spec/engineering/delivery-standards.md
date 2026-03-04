# Delivery standards (feature closure discipline)
Status: Draft (2026-03-04)

## Purpose
Закрепить обязательную дисциплину закрытия фич: traceability в git, запуск приемочных проверок и фиксация доказательств в memory bank.

## SSoT map (where each rule lives)
- [Git flow](../operations/git-flow.md) — SSoT по веткам, commit convention (`[FT-*]`/`[EP-*]`), PR-правилам и обязательным ссылкам на EP/FT документы. Читать перед созданием ветки/PR, чтобы изменения были трассируемыми.
- [Verification matrix](../../plans/verification-matrix.md) — SSoT по обязательным acceptance/GS проверкам и формату execution evidence. Читать перед закрытием фичи, чтобы “done” опирался на фактические прогоны.
- [How we plan epics & features](../../plans/how-we-plan.md) — SSoT по DoD фичи и структуре сценариев. Читать при планировании, чтобы сразу готовить тестируемый вертикальный слайс.

## Mandatory closure checklist (applies to every FT)
1) Коммиты и PR оформлены по traceability-правилам (`[FT-*]`/`[EP-*]`, ссылки на EP/FT документы).
2) Прогнаны acceptance-сценарии и обязательные тесты для фичи (по verification matrix).
3) В feature doc есть блок `Acceptance evidence (YYYY-MM-DD)` с командами/результатами.
4) В verification matrix добавлен/обновлён execution evidence по соответствующему EP.

Если хотя бы один пункт не выполнен — фича не переводится в `Completed`.
