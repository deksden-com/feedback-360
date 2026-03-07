# Theme tokens
Status: Draft (2026-03-07)

Цель: зафиксировать минимальный набор visual tokens для `apps/web`, чтобы UI polish шёл через систему, а не через случайные локальные цвета/отступы.

## Token groups
### Color tokens
- `bg-app`
- `bg-surface`
- `bg-surface-muted`
- `text-primary`
- `text-secondary`
- `border-default`
- `accent-primary`
- `accent-primary-foreground`
- `success`
- `warning`
- `danger`
- `info`

### Surface tokens
- `surface-default`
- `surface-muted`
- `surface-elevated`
- `surface-selected`

### Typography tokens
- `page-title`
- `section-title`
- `metric-value`
- `body`
- `helper`

### Radius / shadow / spacing
- one consistent radius scale;
- one low elevation and one medium elevation;
- spacing scale follows Tailwind baseline, but page and card compositions use documented defaults.

## Implementation direction
- Tokens live as CSS variables/theme variables in `apps/web`.
- UI components consume semantic tokens, not raw ad-hoc colors.
- Screen-level classes may compose tokens but do not invent new semantic meanings locally.

## Rule
Если новый UI feature требует новый repeated visual meaning, сначала он появляется в design-system doc, а уже потом в коде.
