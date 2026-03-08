# XE-001 — как это работает и как проверить руками

Этот документ показывает, как вручную зайти в результаты сценария `XE-001` на `beta`, не используя magic link.

## Что именно делает сценарий

`XE-001` поднимает изолированную тестовую компанию и проходит сквозной happy path:

1. создаёт компанию, оргструктуру и модель компетенций;
2. создаёт и стартует кампанию `XE-001 Campaign`;
3. выпускает приглашения через test notification adapter;
4. заполняет анкеты по зафиксированной fixture;
5. завершает кампанию и проверяет результаты для:
   - сотрудника,
   - руководителя,
   - HR.

Фикстуры сценария лежат рядом:

- `fixtures/answers.json`
- `fixtures/expected-results.json`

## Как мы входим без magic link

Для `XE-001` есть test-only XE login flow:

- CLI выпускает short-lived token для конкретного `run` и `actor`;
- login page на `beta` умеет принять этот token;
- после входа пользователь получает **обычную сессию** приложения;
- обычный `logout` завершает эту сессию штатно.

Скрин ниже показывает helper на странице логина:

![XE token helper на login page](./assets/login-xe-helper.png)

## Проверенный beta run

Сейчас удобнее всего использовать helper-скрипты **без явного `run-id`**:

- они найдут самый свежий валидный `XE-001` run на `beta`;
- если локальный registry содержит только устаревшие run-ы, helper автоматически создаст новый `XE-001` run и затем выпустит token.

При необходимости можно всё ещё передать конкретный `run-id` вручную.

## Быстрый вход по ролям

### 1. Сотрудник

Сгенерировать токен:

```bash
./scenarios/XE-001/scripts/subject-token.sh
```

Дальше:

1. открой `https://beta.go360go.ru/auth/login`
2. нажми `Cmd+Shift+X` или кнопку `Показать`
3. вставь token
4. нажми `Войти по XE token`
5. открой `/results`

Что должно быть видно:

- shell с активной компанией `XE 001 ...`
- роль `Сотрудник`
- экран `Мои результаты`

Скрин employee view:

![Employee results](./assets/employee-results.png)

### 2. Руководитель

Сгенерировать токен:

```bash
./scenarios/XE-001/scripts/manager-token.sh
```

После входа открой:

- `https://beta.go360go.ru/results/team`

Что должно быть видно:

- роль `Руководитель`
- раздел `Результаты команды`
- доступная кампания `XE-001 Campaign`
- сотрудник `Sam Subject`

Скрин manager view:

![Manager results](./assets/manager-results.png)

### 3. HR-администратор

Сгенерировать токен:

```bash
./scenarios/XE-001/scripts/hr-admin-token.sh
```

После входа открой:

- `https://beta.go360go.ru/results/hr`

Что должно быть видно:

- роль `HR-администратор`
- раздел `HR результаты`
- кампания `XE-001 Campaign`
- список сотрудников из snapshot кампании

Скрин HR view:

![HR results](./assets/hr-results.png)

## Что делают helper-скрипты

Скрипты:

- `scripts/subject-token.sh`
- `scripts/manager-token.sh`
- `scripts/hr-admin-token.sh`

это thin wrappers над:

- `scripts/issue-token.sh`

Они:

- вызывают CLI `xe auth issue`
- могут принять явный `run-id`
- если `run-id` не передан — ищут самый свежий валидный `XE-001` run
- на `beta` могут автоматически поднять новый run, если все найденные run-ы уже устарели

Полезные переменные:

- `XE_ENV=beta|local`
- `XE_BASE_URL=https://beta.go360go.ru`
- `XE_OUTPUT=token|human`

Пример human-режима:

```bash
XE_OUTPUT=human ./scenarios/XE-001/scripts/manager-token.sh
```

## Что уже проверено

Для этих helper-скриптов уже подтверждено:

- token generation для `subject`
- token generation для `manager`
- token generation для `hr_admin`
- реальный вход на `beta`
- открытие соответствующих результатов:
  - `/results`
  - `/results/team`
  - `/results/hr`

## Если что-то не работает

Проверь по порядку:

1. что helper успел закончить поиск/создание валидного run-а на `beta`;
2. что открыт `https://beta.go360go.ru/auth/login`;
3. что XE helper раскрыт (`Cmd+Shift+X`);
4. что token вставлен полностью, без лишних пробелов;
5. что после входа active company выбрана автоматически.

Если нужно, можно заново выпустить token — старый токен короткоживущий.
