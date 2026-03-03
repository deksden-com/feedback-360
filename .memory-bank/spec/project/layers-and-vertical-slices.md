# Layers & vertical slices
Status: Draft (2026-03-03)

Цель: держать **слои** (для простоты и тестируемости) и одновременно строить продукт **вертикальными слайсами** (чтобы рано получать работающий “сквозной” продукт).

## Layers (минимальные, без оверинжиниринга)
- **Core (domain logic)**: use-cases, политики, расчёты, state machines. Здесь живут инварианты.
- **Adapters**: DB (Drizzle/Supabase), Email (Resend), Scheduler (cron/outbox), AI client, Auth adapter.
- **Typed contract + client**: DTO/ошибки/операции и единый клиент для UI/CLI.
- **Delivery**:
  - CLI (Commander): вызывает client, не содержит доменных правил.
  - Web UI (Next): тонкий UI поверх client.

## Vertical slice definition of done
Каждая фича (минимальный вертикальный слайс) включает:
1) contract/операцию (если нужно),
2) core use-case + policy,
3) DB миграции (если нужно) + seed/fixtures (если нужно),
4) CLI команду для вызова (или расширение существующей),
5) автотест(ы): unit/integration, и (только для критичных путей) e2e.

## Guardrails (чтобы клиенты не “умнели”)
- UI/CLI не должны содержать доменных правил (анонимность, веса, переходы) — только отображение и вызовы операций.
- Любая “бизнес-валидация” — в core.

