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

## Visual baseline v2 additions
- `primary` remains `#1152d4` and is the canonical blue accent for auth, dashboard and active selection states.
- App background should use a light neutral close to `#f6f6f8`.
- White cards on light background are the default product surface.
- Borders stay subtle (`slate-100/200` range), shadows low by default, stronger only for focused/active blocks.
- Typography should tighten around an `Inter`-like feel: bold page titles, compact uppercase meta labels, muted helper copy.

## Rule
Если новый UI feature требует новый repeated visual meaning, сначала он появляется в design-system doc, а уже потом в коде.
