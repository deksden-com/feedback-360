# Semantic status colors
Status: Draft (2026-03-07)

Цель: сделать статусы и badges узнаваемыми по всему приложению и не заставлять каждый экран заново решать, “какой цвет у `started`”.

## Campaign states
- `draft` → neutral/muted
- `started` → primary/info
- `ended` → warning
- `processing_ai` → info/violet-like processing semantic
- `ai_failed` → danger
- `completed` → success

## Questionnaire states
- `not_started` → muted
- `in_progress` → primary/info
- `submitted` → success
- `read_only` → neutral with explanatory note

## Employee/org admin states
- `active` → success/neutral-positive
- `inactive` → warning-muted
- `soft_deleted` / historical marker → muted / low-emphasis semantic

## Rule
- semantic meaning first, hue second;
- status colors must remain accessible in light mode and legible in badges, pills and summary cards;
- the same domain status uses the same semantic token across all screens.
