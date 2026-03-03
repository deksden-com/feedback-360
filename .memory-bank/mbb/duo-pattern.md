# MBB — Duo pattern (summary + details)
Status: Draft (2026-03-03)

Duo pattern используется, когда тема становится слишком объёмной или многослойной.

## Roles
- **Summary file**: короткий обзор, ключевые тезисы, аннотированные ссылки на детали.
- **Detail files**: отдельные документы по конкретным аспектам (architecture, API, examples, edge cases).

## When to apply
- документ “распухает” и начинает смешивать несколько самостоятельных тем,
- появляются разные аудитории (быстрый обзор vs deep dive),
- нужно избежать повторов при расширении темы.

## Naming
- `<topic>.md` — обзор.
- `<topic>-<aspect>.md` — детализация (`-architecture`, `-api`, `-examples`, `-edge-cases`, `-testing`).
- `index.md` — навигация (если файлов много).

