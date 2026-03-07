# Frontend UI stack (web)
Status: Updated (2026-03-05)

## Decision
- Для `apps/web` фиксируем UI foundation: `Tailwind CSS v4` + `shadcn/ui` (CLI + components registry).
- Версии на дату фиксации:
  - `tailwindcss@4.2.1`,
  - `@tailwindcss/postcss@4.2.1`,
  - `shadcn@3.8.5`,
  - `tw-animate-css@1.4.0`.

## Why
- Tailwind v4 — текущий основной путь для Next.js и минимальный runtime overhead для utility-first стилизации.
- shadcn/ui даёт быстрый и контролируемый старт UI без vendor lock-in: код компонентов хранится у нас в репозитории и адаптируется под доменные экраны.

## Design-system layering
- `Tailwind v4 + shadcn/ui` — foundation stack.
- Visual tokens, status semantics и repeated product patterns живут не “по месту”, а в [UI design system](../ui/design-system/index.md).
- Любой заметный UI polish/refactor должен сначала сверяться с design-system docs, а уже потом менять screen-level implementation.

## Implementation baseline (MVP)
- `apps/web/postcss.config.mjs`: `@tailwindcss/postcss` plugin.
- `apps/web/src/app/globals.css`: `@import "tailwindcss"` + shadcn theme variables.
- `apps/web/components.json`: конфигурация shadcn aliases/style/base color.
- `apps/web/src/lib/utils.ts`: helper `cn(...)`.
- Первый компонент из registry: `apps/web/src/components/ui/button.tsx`.

## Upgrade policy
- Upgrade `tailwindcss`/`@tailwindcss/postcss` и `shadcn` делаем синхронно через отдельную FT с прогоном `web lint/typecheck/test/build` + Playwright smoke.
- Если новая major-версия меняет генерацию компонентов или theme API, обновляем этот документ и связанные UI feature docs до merge.

## External references (primary)
- [Tailwind CSS — Install Tailwind CSS with Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs): официальный гайд установки Tailwind v4 в Next.js через `@tailwindcss/postcss` и `@import "tailwindcss"`. Читать, чтобы не использовать устаревший v3-конфиг и держать setup совместимым с актуальным guide.
- [shadcn/ui — Installation for Next.js](https://ui.shadcn.com/docs/installation/next): официальный путь инициализации `shadcn` в существующем Next.js проекте с alias/checks. Читать, чтобы CLI-конфиг (`components.json`) и структура файлов совпадали с поддерживаемым baseline.
- [shadcn/ui — CLI](https://ui.shadcn.com/docs/cli): актуальные команды/флаги `init` и `add` для генерации foundation и компонентов. Читать, чтобы reproducible bootstrap делался командами CLI, а не ручными ad-hoc правками.
- [shadcn/ui — React 19 + Tailwind v4 support](https://ui.shadcn.com/docs/react-19): матрица совместимости React 19 / Next / Tailwind v4 для shadcn/ui. Читать, чтобы выбранный стек не расходился с официально поддерживаемыми комбинациями.
