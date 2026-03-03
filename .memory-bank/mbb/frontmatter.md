# MBB — Frontmatter
Status: Draft (2026-03-03)

В `dd-flow` используется YAML frontmatter для машиночитаемости (version/status/parent/children/tags/history).
В этом проекте MVP-решение: **frontmatter опционален** (пока).

План:
- новые документы в `.memory-bank/mbb/` можно писать с frontmatter (по желанию),
- для остальных документов миграцию на frontmatter делаем позже, если увидим реальную пользу (валидация, поиск, сборка индексов).

Если используем frontmatter, минимальный набор полей:
- `description`: что внутри,
- `purpose`: зачем читать,
- `status`: ACTIVE|DRAFT,
- `date`: YYYY-MM-DD.

