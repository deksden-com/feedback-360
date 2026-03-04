# Campaign lifecycle
Status: Draft (2026-03-03)

## Statuses
Каноничные статусы кампании:
- `draft`: кампания настраивается, никто не оценивает.
- `started`: оценки разрешены (анкеты можно сохранять/submit).
- `ended`: оценки запрещены (анкеты read-only).
- `processing_ai`: AI-обработка текстов запущена/в процессе.
- `ai_failed`: AI-обработка завершилась ошибкой (доступен retry).
- `completed`: результаты готовы (AI-обработка успешна, витрина результатов доступна).

## Allowed transitions (high level)
- `draft -> started`: HR Admin стартует кампанию.
- `started -> ended`: наступил `end_at` (cron) или HR Admin остановил досрочно.
- `ended -> processing_ai`: HR Admin запускает AI job (или auto-политика в будущем).
- `processing_ai -> completed`: получен валидный webhook с результатом.
- `processing_ai -> ai_failed`: исчерпаны ретраи/получена ошибка.
- `ai_failed -> processing_ai`: HR Admin запускает retry.

## Transition idempotency (MVP)
- `campaign.start`:
  - `draft -> started` (изменение),
  - `started -> started` (идемпотентный no-op),
  - из других статусов — `invalid_transition`.
- `campaign.stop` / `campaign.end`:
  - `started -> ended` (изменение),
  - `ended -> ended` (идемпотентный no-op),
  - из других статусов — `invalid_transition`.

## Freeze (lock) rule
MVP-правило: **первый `draft save` в любой анкете** фиксирует `campaign.locked_at`.

## Mutability rules (agreed)
- После `started` нельзя менять:
  - `model_version_id` (модель компетенций кампании),
  - состав участников кампании (participants).
- Матрицу назначений и веса групп можно менять только до `campaign.locked_at`.

После `locked_at`:
- **Запрещено** менять назначения (матрицу “кто кого оценивает”).
- **Запрещено** менять веса групп оценщиков.
- **Разрешено** менять расписание напоминаний (операционный параметр; не влияет на честность оценки), с audit log.
- **Разрешено** продлить/сократить `end_at` и остановить кампанию досрочно, с audit log.

Обоснование “почему так” хранится в ADR: [ADR 0003 — Freeze on first draft save](../../adr/0003-freeze-on-draft-save.md) — документирует компромиссы, UX-риски и митигации. Читать, чтобы понимать мотивацию и последствия правила.
