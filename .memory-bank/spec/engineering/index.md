# Engineering Index
Status: Draft (2026-03-03)

- [Coding style](coding-style.md) — стиль кода (TS/Node/Next), ошибки, границы модулей, CLI output и общие соглашения. Читать перед реализацией фич, чтобы код был единообразным и “тонкие клиенты” не обрастали логикой.
- [Frontend UI stack](frontend-ui-stack.md) — зафиксированный baseline для `apps/web` (Tailwind v4 + shadcn/ui) и политика обновления версий. Читать перед UI-изменениями, чтобы все фичи использовали один и тот же стек и не плодили альтернативные подходы.
- [Architecture guardrails](architecture-guardrails.md) — правила слоёв/импортов и как держать vertical slices видимыми в коде. Читать, чтобы не ломать core+contract+client-first подход.
- [Delivery standards](delivery-standards.md) — правила git flow дисциплины, commit traceability, quality gate + acceptance gate и фиксации evidence. Читать перед закрытием фичи, чтобы “Completed” всегда подтверждалось проверками и артефактами.
- [Testing standards](testing-standards.md) — уровни тестов, seeds как контракт, golden сценарии и последовательность проверок по FT. Читать, чтобы DoD фичи был проверяемым и воспроизводимым.
- [Documentation standards](documentation-standards.md) — как писать/обновлять документы и индексы в `.memory-bank/`. Читать, чтобы не плодить дубли и не терять SSoT.
