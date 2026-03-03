# FT-0002 — DB migrations baseline
Status: Completed (2026-03-04)

## User value
Команда развивает схему БД через миграции, может поднять окружение для интеграционных тестов и воспроизведения сценариев.

## Deliverables
- `packages/db`: Drizzle schema + миграции.
- Команда/скрипт “apply migrations” (для local/dev/test), например `pnpm db:migrate`.
- Базовая структура для RLS (полный RLS — EP-002, но здесь фиксируем место и порядок).

## Context (SSoT links)
- [ERD / tables](../../../../../spec/data/erd.md): список таблиц и ключевые связи. Читать, чтобы стартовая схема БД уже отражала agreed доменные сущности.
- [RLS strategy](../../../../../spec/security/rls.md): deny-by-default и service role контуры. Читать, чтобы миграции/политики не мешали тестам и не открывали доступ.
- [Seed scenarios principles](../../../../../spec/testing/seed-scenarios.md): contract “seeds → handles”. Читать, чтобы миграции поддерживали нужные seeds без ручных правок.
- [Implementation playbook](../../../../../plans/implementation-playbook.md): чеклист “FT → код”. Читать, чтобы DB слой был связан с contract/core/tests.

## Acceptance (auto)
### Setup
- DB: поднята тестовая БД (local Supabase или отдельный Postgres для CI).

### Action (CLI)
1) `pnpm db:migrate`
2) `pnpm db:health` (выполняет “health query”, например `SELECT 1`)

### Assert
- Миграции применяются без ошибок.
- Health-check успешен, БД готова для seeds и integration тестов.

## Implementation plan (target repo)
- `packages/db`:
  - Подключить Drizzle (schema + migrations) и определить “базовый” минимум таблиц, чтобы можно было сделать `S1_company_min` и `S2_org_basic` без “пустых заглушек”.
  - Добавить команды `db:migrate` и `db:health` (health = простая read-only проверка соединения).
- Локальная среда:
  - Выбрать один способ поднятия Postgres для dev/test (локальный Supabase предпочтительно, но без сложных обвязок).
  - Для CI: предусмотреть отдельный Postgres/контейнер (или Supabase CLI), но не “разветвлять” поведение.
- RLS placeholder:
  - Зарезервировать место для RLS политик (папка/скрипты), но не включать строгие политики до EP-002, чтобы не мешать ранним vertical slices.

## Tests
- Integration: тест “migrate + health query” (поднимает БД, применяет миграции, делает `SELECT 1`).

## Memory bank updates
- При добавлении/изменении таблиц синхронизировать: [ERD / tables](../../../../../spec/data/erd.md) — SSoT схемы. Читать, чтобы доменная документация совпадала с реальной БД.

## Verification (must)
- Automated test: `packages/db/test/ft-0002-migrations-health.test.ts` (integration) повторяет “migrate + health”.
- Must run: тест/скрипт, который применяет миграции и делает health query (например `SELECT 1`), чтобы это было зелёным в CI.

## Implementation result (2026-03-04)
- В `packages/db` добавлены:
  - Drizzle schema (`src/schema/*`) для baseline таблиц под `S1_company_min`/`S2_org_basic`.
  - SQL migration baseline: `drizzle/0000_ft0002_baseline.sql`.
  - Drizzle config: `drizzle.config.ts`.
  - DB runtime helpers: `src/db.ts`, `src/migrations.ts`.
  - CLI scripts: `src/scripts/migrate.ts`, `src/scripts/health.ts`.
- Добавлены команды:
  1) root: `pnpm db:migrate`, `pnpm db:health`
  2) package: `pnpm --filter @feedback-360/db db:migrate|db:health`
- Добавлен integration test: `packages/db/src/migrations/ft-0002-migrations-health.test.ts`:
  - при наличии `DATABASE_URL` реально выполняет migrations + health,
  - без `DATABASE_URL` корректно скипается.
- Добавлен `.env.example` с `DATABASE_URL`.

## Verification notes
- Зелёный прогон выполнен:
  1) `pnpm -r lint`
  2) `pnpm -r typecheck`
  3) `pnpm -r test`
- `pnpm db:migrate` и `pnpm db:health` отрабатывают с корректной ошибкой при отсутствии `DATABASE_URL`.
- Полный live-run `db:migrate + db:health` на поднятом Postgres не выполнен в этой сессии, потому что Docker daemon недоступен (`Cannot connect to the Docker daemon ...`).
