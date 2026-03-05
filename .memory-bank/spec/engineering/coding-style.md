# Coding style (project-wide)
Status: Draft (2026-03-03)

## Principles
- Без оверинжиниринга: делаем “самым простым способом”, но с требуемыми функциями.
- Доменные правила (анонимность/веса/переходы/lock) живут в core, а не в UI/CLI.
- Клиенты (UI/CLI) не содержат значимой логики: только валидация формы/схемы и вызовы typed client API.

## Formatting & lint
- Biome — единый форматтер/линтер (без дублирующих инструментов).

## TypeScript
- По умолчанию строгая типизация: избегаем `any` и “размытых” DTO.
- Ошибки наружу (contract/CLI): структурированные `code + message + details`.

## Code organization (high level)
- Feature-first внутри слоёв: группируем use-cases/операции по “слайсам”, чтобы вертикальный путь фичи был очевиден.
- Общие вещи (ошибки/порты/политики) не копируем между слайсами — выносим, когда появляется повтор.

## Web UI conventions
- В `apps/web` используем Tailwind v4 + shadcn/ui как единый UI foundation.
- Базовые UI building blocks добавляем через `shadcn` registry и дорабатываем локально (без копирования внешних UI kit поверх этого стека).
- UI-компоненты остаются презентационными: доменные расчёты/политики не дублируем в компонентах.

## CLI conventions
- Human-readable по умолчанию, `--json` — стабильная машиночитаемая схема.
- При `--json` никаких “человеческих” сообщений в полях данных (только отдельное поле `message`, если нужно).

## Post-coding quality gate (mandatory)
- Любое изменение кода завершаем проверками качества: `lint` + `typecheck` + `test`.
- Если затронуты части, где есть сборка (например Next.js app/package с `build`), дополнительно прогоняем `build`.
- Эти проверки **не заменяют** приемочный сценарий фичи: acceptance прогоняется отдельно после реализации FT.
- Тесты пишем и обновляем по policy проекта (уровни unit/integration/contract/e2e).

Ссылки (аннотированные):
- [Testing standards](testing-standards.md) — уровни тестов, правила размещения FT/GS тестов и completion gate. Читать, чтобы писать тесты в согласованном формате и закрывать фичи только после проверок.
- [Delivery standards](delivery-standards.md) — дисциплина закрытия фич (traceability, code checks, acceptance evidence). Читать, чтобы статус `Completed` всегда был подтверждён артефактами.
- [Frontend UI stack](frontend-ui-stack.md) — фиксируем версии и bootstrap правила Tailwind/shadcn. Читать перед изменениями в `apps/web`, чтобы стек оставался консистентным.
