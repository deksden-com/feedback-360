# FT-0093 — Beta smoke release gates
Status: Draft (2026-03-05)

## User value
После деплоя на `beta` у нас есть не только “зелёный билд”, но и подтверждение, что ключевые пользовательские сценарии реально живы на настоящем окружении.

## Deliverables
- Каталог обязательных `beta` smoke flows для runtime/user-facing изменений.
- Стандарт прогона через browser automation и хранения screenshot evidence.
- Release rule: user-facing фича не считается закрытой без beta smoke (где применимо).

## Context (SSoT links)
- [Runbook](../../../../../spec/operations/runbook.md): текущий deploy/smoke baseline. Читать, чтобы не дублировать release process.
- [Delivery standards](../../../../../spec/engineering/delivery-standards.md): обязательность deploy evidence. Читать, чтобы smoke стал частью DoD.
- [UI sitemap & flows](../../../../../spec/ui/sitemap-and-flows.md): какие user flows критичны. Читать, чтобы smoke покрывал реальные сценарии, а не случайные страницы.

## Acceptance (auto)
### Setup
- Изменение задеплоено на `https://beta.go360go.ru`.
- Есть smoke-аккаунты/seed данные для критичных ролей.

### Action
1) Прогнать agreed smoke flow(s) через browser automation.
2) Сохранить screenshots/logs.
3) Записать evidence в FT-doc + verification matrix.

### Assert
- Smoke зелёный на реальном `beta`.
- Evidence приложен в markdown как изображения.
- Release gate зафиксирован в стандартах и повторяем агентом.

## Implementation plan (target repo)
- Зафиксировать список обязательных smoke flow categories:
  - auth/company switch,
  - questionnaire path,
  - results visibility,
  - HR campaign path.
- Определить, какие фичи требуют `beta` smoke обязательно.
- Нормализовать naming и storage screenshots under `.memory-bank/evidence/`.
- Обновить docs и feature template.

## Tests
- Browser smoke on `beta`.
- Regression: хотя бы один runtime PR подтверждает прохождение нового gate.

## Memory bank updates
- Обновить [Runbook](../../../../../spec/operations/runbook.md), [Delivery standards](../../../../../spec/engineering/delivery-standards.md), [Feature template](../../../../feature-template.md) если меняется обязательность evidence.

## Verification (must)
- Automated/browser check: smoke against `beta`.
- Must run: минимум один auth flow и один domain flow на реальном deploy.

## Manual verification (deployed environment)
- Environment:
  - URL: `https://beta.go360go.ru`
  - Date: `2026-03-05`
- Steps:
  1. Открыть smoke сценарий по инструкции.
  2. Пройти путь до целевого экрана.
  3. Снять screenshot evidence.
- Expected:
  - feature работает на реальном `beta`;
  - evidence приложен в FT markdown и verification matrix.
