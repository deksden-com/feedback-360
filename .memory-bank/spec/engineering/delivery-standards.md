# Delivery standards (feature closure discipline)
Status: Draft (2026-03-04)

## Purpose
Закрепить обязательную дисциплину закрытия фич: traceability в git, отдельный code-quality gate, отдельный acceptance gate и фиксация доказательств в memory bank.

## SSoT map (where each rule lives)
- [Git flow](../operations/git-flow.md) — SSoT по веткам, commit convention (`[FT-*]`/`[EP-*]`), PR-правилам и обязательным ссылкам на EP/FT документы. Читать перед созданием ветки/PR, чтобы изменения были трассируемыми.
- [Verification matrix](../../plans/verification-matrix.md) — SSoT по обязательным acceptance/GS проверкам и формату execution evidence. Читать перед закрытием фичи, чтобы “done” опирался на фактические прогоны.
- [How we plan epics & features](../../plans/how-we-plan.md) — SSoT по DoD фичи и структуре сценариев. Читать при планировании, чтобы сразу готовить тестируемый вертикальный слайс.

## Mandatory closure checklist (applies to every FT)
1) Коммиты и PR оформлены по traceability-правилам (`[FT-*]`/`[EP-*]`, ссылки на EP/FT документы).
2) Прогнаны code-quality проверки: `pnpm -r lint`, `pnpm -r typecheck`, `pnpm -r test` (+ `build`, где применимо).
3) После реализации фичи отдельно прогнан её `Acceptance (auto)` сценарий и обязательные GS (по verification matrix).
4) В feature doc есть блок `Quality checks evidence (YYYY-MM-DD)` с результатами `lint/typecheck/test` (+ `build`, где применимо).
5) В feature doc есть блок `Acceptance evidence (YYYY-MM-DD)` с командами/результатами приемочного сценария и связанных GS.
6) В verification matrix добавлен/обновлён execution evidence по соответствующему EP.
7) В feature doc есть раздел `Manual verification (deployed environment)`:
   - целевое окружение (обычно `beta`), URL и дата,
   - preconditions (аккаунт/роль/seed/feature flag),
   - пошаговая инструкция “от начала до конца” + ожидаемый результат каждого шага,
   - пометка `N/A` с обоснованием только для non-user-facing фич.
8) Для runtime/deploy/integration-инфраструктурных изменений зафиксированы CI/CD доказательства:
   - ссылка на GitHub Actions run (или check-runs commit),
   - ссылка на Vercel deployment (preview/beta/prod),
   - итоговый статус (`success/ready`) и root-cause заметка, если был fail.

Если хотя бы один пункт не выполнен — фича не переводится в `Completed`.

Примечание для infra/docs-only фич:
- Если фича не вносит изменений в исполняемый код (например, DNS/операционные артефакты), в `Quality checks evidence` допускается `N/A` с кратким обоснованием.
- Для docs-only фич без runtime изменений CI/CD evidence можно отмечать как `N/A` с обоснованием.

## Epic progress reporting (mandatory)
- В каждом epic-документе должен быть блок `## Progress report (evidence-based)`.
- В блоке фиксируем минимум:
  - `total_features` (сколько FT в эпике),
  - `completed_features` (сколько FT имеют статус `Completed`),
  - `evidence_confirmed_features` (сколько FT имеют `Quality checks evidence`, `Acceptance evidence` и запись в verification matrix),
  - дата обновления отчёта.
- В отчёте должна быть ссылка на:
  - [Verification matrix](../../plans/verification-matrix.md) — секция execution evidence по этому эпику. Читать, чтобы аудит готовности проверялся по одному SSoT-источнику.
- Отчёт обновляем каждый раз, когда меняется статус FT или evidence по FT.

## Visual evidence policy (screenshots, optional-by-context)
Скриншоты используем там, где они реально повышают проверяемость результата.

Когда скриншоты **рекомендуются**:
- UI/UX фичи (экраны, переходы, состояния до/после действия).
- Внешние панели/сервисы (Vercel/Supabase/Resend/Sentry), где часть приемки проверяется в интерфейсе провайдера.
- Многошаговые сценарии, где визуальная динамика важна для понимания.

Когда скриншоты **обычно не нужны**:
- Чистые core/contract/unit-integration фичи, где достаточно автотестов, JSON-вывода и логов команд.

Правила оформления:
- Допускается несколько скриншотов на одну фичу (по этапам сценария).
- Именование: `step-01-...`, `step-02-...` (по порядку сценария).
- Хранение (если кладём в репозиторий): `.memory-bank/evidence/<EP>/<FT>/<YYYY-MM-DD>/`.
- В `Acceptance evidence` указываем список артефактов (путь к скринам) и что именно подтверждает каждый скрин.
- Перед сохранением обязательно исключить секреты/PII (токены, приватные email, персональные данные).
