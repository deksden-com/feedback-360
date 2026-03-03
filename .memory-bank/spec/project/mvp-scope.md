# MVP scope
Status: Draft (2026-03-03)

MVP включает:
- HR-справочник (employees) + оргструктура (ручной ввод).
- Компетенции: версии модели; поддержка indicators (1..5 + NA) и levels (1..4 + UNSURE).
- Кампании: draft/start/end/stop + статусы `processing_ai/ai_failed/completed`.
- Матрица назначений: ручная + автогенерация по оргструктуре; freeze на первом draft save.
- Анкеты: draft/save/submit; read-only после окончания.
- Результаты: анонимность threshold=3; менеджер всегда не анонимен; self вес 0%; динамический пересчёт весов при отсутствии/скрытии групп.
- Нотификации: email-only (outbox + идемпотентность + расписания по таймзоне).
- AI: агрегированная постобработка open text + webhook security + retry кнопка для HR.

