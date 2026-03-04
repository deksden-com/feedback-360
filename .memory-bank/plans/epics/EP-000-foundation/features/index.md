# EP-000 — Feature catalog
Status: Draft (2026-03-03)

- [FT-0001 Workspace scaffold](FT-0001-workspace-scaffold/index.md): pnpm workspace + Biome/Vitest/Playwright базис. Статус: Completed (2026-03-03). Читать, чтобы запуск/линт/тесты стали воспроизводимыми.
- [FT-0002 DB migrations baseline](FT-0002-db-migrations-baseline/index.md): Drizzle schema/migrations и база для локальной БД. Статус: Completed (2026-03-04). Читать, чтобы схема развивалась миграциями и тесты могли поднимать БД.
- [FT-0003 Seed runner + handles](FT-0003-seed-runner-handles/index.md): `seed.run` + JSON `handles` контракт + `S0/S1/S2` seeds. Статус: Completed (2026-03-04). Читать, чтобы сценарии/тесты не хардкодили id.
- [FT-0004 Domains & DNS (Resend)](FT-0004-domains-dns-resend/index.md): DNS SSoT + Resend DKIM/SPF/DMARC записи под Vercel NS. Статус: Completed (2026-03-04). Читать, чтобы не терять DNS-детали и быстро включить email.
- [FT-0005 Web App Router scaffold](FT-0005-web-app-router-scaffold/index.md): базовый Next.js App Router web app для интеграций и health checks. Статус: Completed (2026-03-04). Читать, чтобы были стабильные runtime точки для деплоя.
- [FT-0006 Sentry SDK integration](FT-0006-sentry-integration/index.md): интеграция Sentry c env-driven конфигом и privacy-safe настройками. Статус: Completed (2026-03-04). Читать, чтобы ошибки ловились одинаково в beta/prod.
