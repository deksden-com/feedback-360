# Visual baseline v2
Status: Draft (2026-03-08)

Этот документ фиксирует **новый визуальный baseline** для следующей волны UI-редизайна. Основной ориентир — clean B2B SaaS стиль из новых `login` / `dashboard` / `questionnaire` reference layouts:

- light neutral app background;
- white surfaces with мягкой границей и аккуратной тенью;
- `Inter`-like плотная типографика без декоративности;
- сильный `primary` синий (`#1152d4`) только для главных акцентов;
- явная иерархия: header → summary → main content → secondary tools.

## Что считаем обязательными признаками стиля
- Светлый app canvas: `#f6f6f8` / близкий semantic token.
- Белые карточки с `rounded-xl`, тонкой границей и low/medium shadow.
- Плотная, но не тяжёлая типографика:
  - page title `2xl/3xl`, weight `800/900`;
  - section title `xl`, weight `700/800`;
  - body `sm/base`, muted secondary text;
  - uppercase micro labels для summary/meta blocks.
- Compact SaaS chrome:
  - лёгкий sidebar;
  - top bar с search/company/actions;
  - user card / menu без лишнего визуального веса.
- CTA hierarchy:
  - один primary button;
  - outline/ghost для secondary;
  - tertiary actions через link/menu.

## Surface patterns
### Auth / entry
- Центрированная card на clean фоне.
- Малый top header с brand.
- Чёткий основной входной путь (`magic link`) и secondary entry (`XE token`, dev helper).

### Dashboard
- Крупный hero block + компактная KPI card справа.
- Ниже: `Current Tasks`, `Quick Shortcuts`, `Recent Activity`.
- Activity выглядит как feed, а не как набор одинаковых карточек.

### CRUD / admin
- Header + toolbar + content list/detail.
- Люди и объекты показываются как SaaS resource rows/cards:
  - name/title first;
  - state/meta second;
  - next action visible.

### Questionnaire
- Focused assessment header.
- Compact progress card.
- Активная competency card сильнее остальных.
- Score tiles визуально главнее комментариев.

### Results
- Report-like layout, не “admin table”.
- Summary hero first.
- Group sections и competency sections явно отделены.
- Sensitive/raw blocks визуально отделены от processed summary.

## Where this baseline applies
- Все новые и materially redesigned screens в `apps/web`.
- Все guides/evidence screenshots после material UI update.
- Все новые screen specs и redesign handoff docs.

## Sync rule
Если новый reference materially меняет visual baseline, сначала обновляем этот документ и design tokens, потом — epic/feature plans и только после этого масштабно переделываем экраны.
