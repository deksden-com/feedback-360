# Feature template
Status: Draft (2026-03-04)

SSoT шаблон фичи (vertical slice) живёт в:
- `../mbb/templates/feature.md`

Почему так:
- один каноничный шаблон → меньше дублей,
- требования к traceability (`[FT-*]/[EP-*]`, ссылки, evidence) подтягиваются из SSoT (см. [Git flow](../spec/operations/git-flow.md) и [Verification matrix](verification-matrix.md)).
- шаблон включает два раздельных блока доказательств: `Quality checks evidence` и `Acceptance evidence`.
- шаблон включает обязательный `Project grounding` перед кодированием (что именно прочитать и зафиксировать).
- шаблон включает обязательный раздел `Manual verification (deployed environment)` — пошаговая инструкция ручной проверки фичи на реальном окружении (`beta` по умолчанию).

Ссылки (аннотированные):
- [Implementation playbook](implementation-playbook.md) — чеклист “FT → код”. Читать, чтобы план был исполнимым и вертикальным.
