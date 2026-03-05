# FT-0094 — Docs and evidence sync
Status: Draft (2026-03-05)

## User value
Статус фичи в меморибанке соответствует реальности: если фича completed, это подтверждено checks/evidence; если нет, это явно видно. Команда не тратит время на расхождение между кодом, PR и документацией.

## Deliverables
- Устранён status drift в epic/feature indexes.
- Правило синхронизации FT/EP docs ↔ verification matrix ↔ PR evidence.
- При необходимости — lightweight checklist/script/process для финальной sync-проверки перед merge.

## Context (SSoT links)
- [MBB principles](../../../../../mbb/principles.md): правила SSoT и evidence-first completion. Читать, чтобы sync не превратился в “дополнительную бумажную работу”.
- [Verification matrix](../../../../verification-matrix.md): где фиксируется execution evidence. Читать, чтобы не было двух конкурирующих источников правды.
- [How we plan](../../../../how-we-plan.md): DoD фичи и эпика. Читать, чтобы sync был встроен в lifecycle завершения.

## Acceptance (auto)
### Setup
- Есть completed FT/EP с evidence.

### Action
1) Проверить индекс эпика, FT-doc и verification matrix.
2) Проверить, что статусы и completed counts совпадают.
3) Проверить, что ссылки на screenshots/evidence живые и корректные.

### Assert
- Нет completed FT без evidence.
- Нет `In Progress`, если все подфичи completed и эпик закрыт.
- Навигация по индексам ведёт к актуальным документам.

## Implementation plan (target repo)
- Пройти текущие индексы и устранить рассинхрон.
- Уточнить правило в docs: что обновляется обязательно при закрытии FT/EP.
- При необходимости добавить lightweight checklist или grep-able convention для status sync.

## Tests
- Docs audit by checklist/search.
- Regression: после закрытия следующей фичи sync выполняется без ручного “доезда”.

## Memory bank updates
- Обновить [Principles](../../../../../mbb/principles.md), [Indexing](../../../../../mbb/indexing.md), [How we plan](../../../../how-we-plan.md) при изменении процесса sync.

## Verification (must)
- Docs audit: FT/EP/index/matrix consistency.
- Must run: manual docs review + search-based consistency check.

## Manual verification (deployed environment)
N/A — документационная/process фича.
