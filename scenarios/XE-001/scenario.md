# XE-001 — First 360 campaign happy path

Этот сценарий создаёт новую изолированную компанию, стартует кампанию 360°, проводит заполнение анкет всеми группами оценщиков и проверяет результаты для employee / manager / HR.

## XE token helpers

Сценарий содержит удобные скрипты для ручного входа на `beta`:

- `./scenarios/XE-001/scripts/subject-token.sh [run-id]`
- `./scenarios/XE-001/scripts/manager-token.sh [run-id]`
- `./scenarios/XE-001/scripts/hr-admin-token.sh [run-id]`

Если `run-id` не передан, скрипт возьмёт последний активный `XE-001` run для `XE_ENV` (по умолчанию `beta`).

Полезные переменные окружения:

- `XE_ENV=beta|local`
- `XE_BASE_URL=https://beta.go360go.ru`
- `XE_OUTPUT=token|human`

## Manual walkthrough

- `./scenarios/XE-001/manual-check.md` — пошаговая инструкция, как вручную зайти в результаты `XE-001` на `beta`, какие команды запускать и что именно должно открыться в UI. Внутри есть встроенные screenshots employee / manager / HR view.
