# How to open `XE-001` results on beta
Status: Draft (2026-03-07)

Эта инструкция показывает, как открыть готовый сценарий `XE-001` на `beta` и посмотреть результаты от лица разных ролей.

## Когда использовать

Используй этот guide, когда нужно:

- быстро проверить живой XE run;
- показать employee / manager / HR views;
- убедиться, что XE token login работает.

## Что понадобится

- локальный доступ к репозиторию;
- рабочий `.env` с `XE_AUTH_SECRET`;
- доступ к `https://beta.go360go.ru`;
- существующий XE run, например `RUN-20260307121525-c767edf3`.

## Выпусти token

Сотрудник:

```bash
./scenarios/XE-001/scripts/subject-token.sh RUN-20260307121525-c767edf3
```

Руководитель:

```bash
./scenarios/XE-001/scripts/manager-token.sh RUN-20260307121525-c767edf3
```

HR:

```bash
./scenarios/XE-001/scripts/hr-admin-token.sh RUN-20260307121525-c767edf3
```

## Войди в систему

1. Открой `https://beta.go360go.ru/auth/login`
2. Нажми `Cmd+Shift+X` или кнопку `Показать`
3. Вставь token
4. Нажми `Войти по XE token`

После этого приложение создаёт обычную пользовательскую сессию.

## Открой нужный экран

- `subject` → `/results`
- `manager` → `/results/team`
- `hr_admin` → `/results/hr`

## Что должно быть видно

- активная компания выбрана автоматически;
- shell показывает правильную роль;
- экран открывается без повторного логина;
- штатный logout завершает сессию.

## Связанные документы

- [`scenarios/XE-001/manual-check.md`](../../../scenarios/XE-001/manual-check.md): подробный beta walkthrough с embedded screenshots и expected outcomes. Читать, если нужен более детальный сценарный чеклист.
- [`scenarios/XE-001/how-it-works.md`](../../../scenarios/XE-001/how-it-works.md): объяснение, как устроен сценарий целиком. Читать, если нужно понять, где заканчивается runner и где начинается UI.
