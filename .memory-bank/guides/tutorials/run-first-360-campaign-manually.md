---
screen_ids:
  - SCR-AUTH-LOGIN
  - SCR-COMPANY-SWITCHER
  - SCR-APP-HOME
  - SCR-HR-EMPLOYEES
  - SCR-HR-EMPLOYEE-CREATE
  - SCR-HR-EMPLOYEE-DETAIL
  - SCR-HR-ORG
  - SCR-HR-MODELS
  - SCR-HR-CAMPAIGNS
  - SCR-HR-CAMPAIGN-CREATE
  - SCR-HR-CAMPAIGN-DETAIL
  - SCR-HR-CAMPAIGN-MATRIX
  - SCR-QUESTIONNAIRES-INBOX
  - SCR-QUESTIONNAIRES-FILL
  - SCR-RESULTS-EMPLOYEE
  - SCR-RESULTS-MANAGER
  - SCR-RESULTS-HR
---

# Tutorial — запустить первую 360-кампанию руками
Status: Draft (2026-03-07)

Этот tutorial показывает продуктовый путь **глазами HR**, а не глазами XE runner.

Его цель — объяснить, как человек вручную проходит через систему:

1. готовит людей и оргконтекст;
2. настраивает модель;
3. создаёт кампанию;
4. запускает её;
5. доводит участников до результатов.

## Для чего этот tutorial

Используй его, когда нужно:

- показать новый продуктовый flow целиком;
- подготовить human-facing документацию для HR;
- понять, какой путь должен пройти пользователь без runner/seed;
- сравнить текущий UI с целевым ручным сценарием.

## Важная оговорка

Это **manual product tutorial**, а не описание `XE-001`.

Различие:

- `XE-001` — reproducible scenario, где setup выполняет runner;
- этот tutorial — описание того, как такой же по смыслу путь должен проходить **человек руками**.

То есть поток похожий, но источник действий другой.

Ещё одна важная оговорка про иллюстрации:

- шаги `1–7` ниже показаны реальными beta-screen'ами из HR demo context;
- шаги `8–10` используют смешанный набор доказательств:
  - где получилось — живые beta-screen'ы;
  - где beta demo не даёт пройти роль участника руками в том же самом контексте — representative screenshots из acceptance/XE evidence.

В каждом таком месте это явно помечено, чтобы tutorial был полезным и при этом честным.

## Целевой путь

### Шаг 1. HR входит в систему

HR открывает приложение, проходит login и попадает в app shell с активной компанией.

На этом шаге пользователь должен:

- успешно войти;
- увидеть роль `HR-администратор`;
- попасть в рабочий контекст компании.

На `beta` сейчас это удобно проверять через demo mode:

1. открыть `https://beta.go360go.ru/auth/login`;
2. нажать `Войти в demo-режиме`;
3. выбрать компанию;
4. попасть на HR home.

Экран входа:

![Login](../assets/manual-first-campaign/step-01a-login__(SCR-AUTH-LOGIN).png)

Выбор активной компании:

![Company switcher](../assets/manual-first-campaign/step-01b-company-switcher__(SCR-COMPANY-SWITCHER).png)

И уже после выбора — HR home в контексте компании `Acme 360 A`:

![HR home](../assets/manual-first-campaign/step-01-hr-home__(SCR-APP-HOME).png)

### Шаг 2. HR заводит сотрудников

HR открывает справочник сотрудников и:

- добавляет сотрудников;
- задаёт email, телефон и основные атрибуты;
- проверяет, что у участников есть корректные профили.

Результат шага:

- сотрудники заведены в HR-справочнике;
- они готовы к использованию в оргструктуре и кампаниях.

Сейчас в интерфейсе это выглядит так:

![Employee directory](../assets/manual-first-campaign/step-02-employees__(SCR-HR-EMPLOYEES).png)

Экран создания сотрудника:

![Employee create](../assets/manual-first-campaign/step-02b-employee-create__(SCR-HR-EMPLOYEE-CREATE).png)

И карточка отдельного сотрудника:

![Employee profile](../assets/manual-first-campaign/step-02c-employee-profile__(SCR-HR-EMPLOYEE-DETAIL).png)

Что руками проверить на этом шаге:

- новый сотрудник появляется в списке без перезагрузки shell;
- у карточки есть email и базовые кадровые поля;
- сотрудника можно потом выбрать в оргструктуре и кампании.

### Шаг 3. HR собирает оргструктуру

HR открывает редактор оргструктуры и:

- создаёт подразделения;
- задаёт руководителей;
- привязывает сотрудников к подразделениям;
- формирует управленческие связи.

Результат шага:

- система понимает, кто кому руководитель, кто коллега и кто подчинённый.

Текущий экран оргструктуры:

![Org editor](../assets/manual-first-campaign/step-03-org__(SCR-HR-ORG).png)

Что руками проверить на этом шаге:

- подразделение видно в дереве;
- у сотрудника и руководителя корректно отображаются связи;
- будущая автогенерация матрицы сможет опираться на этот контекст.

### Шаг 4. HR создаёт модель компетенций

HR открывает каталог моделей и:

- создаёт draft-версию модели;
- добавляет группы компетенций;
- добавляет компетенции и индикаторы;
- проверяет структуру и публикует модель.

Результат шага:

- есть готовая модель, которую можно привязать к кампании.

Текущий каталог моделей:

![Model catalog](../assets/manual-first-campaign/step-04-models__(SCR-HR-MODELS).png)

Экран создания draft-модели:

![Model create](../assets/manual-first-campaign/step-04b-model-create__(SCR-HR-MODEL-CREATE).png)

Что руками проверить на этом шаге:

- draft-модель появляется в каталоге;
- у модели видны группы и компетенции;
- модель можно потом выбрать в новой кампании.

### Шаг 5. HR создаёт кампанию

HR открывает раздел кампаний и:

- создаёт draft кампанию;
- выбирает модель;
- задаёт даты;
- проверяет веса и timezone;
- сохраняет draft.

Результат шага:

- появляется кампания, готовая к старту.

Текущий список HR-кампаний:

![Campaign list](../assets/manual-first-campaign/step-05-campaigns__(SCR-HR-CAMPAIGNS).png)

Экран создания draft-кампании:

![Campaign create](../assets/manual-first-campaign/step-05b-campaign-create__(SCR-HR-CAMPAIGN-CREATE).png)

Что руками проверить на этом шаге:

- draft появляется в списке кампаний;
- у кампании привязана модель и сроки;
- её можно открыть в detail и продолжить настройку.

### Шаг 6. HR настраивает участников и матрицу

HR добавляет в кампанию сотрудников и проверяет, кто кого оценивает:

- subject;
- руководитель;
- коллеги;
- подчинённые;
- self.

Если включена автогенерация, HR проверяет предложенную матрицу и корректирует её.

Результат шага:

- матрица готова к запуску кампании.

Когда кампания уже открыта, HR работает с detail page и matrix builder.

Карточка кампании / operational detail:

![Campaign detail](../assets/manual-first-campaign/step-06-campaign-detail__(SCR-HR-CAMPAIGN-DETAIL).png)

Матрица оценивания:

![Matrix builder](../assets/manual-first-campaign/step-07-matrix-builder__(SCR-HR-CAMPAIGN-MATRIX).png)

Что руками проверить на этом шаге:

- у subject назначены `self`, `manager`, `peers`, `subordinates`;
- матрица не содержит дублей;
- состав участников соответствует ожиданиям HR.

### Шаг 7. HR стартует кампанию

После старта:

- участники получают приглашения;
- кампания переходит в `started`;
- запускается период работы с анкетами.

Результат шага:

- система готова принимать ответы.

Ниже — реальный beta-screen той же кампании уже в рабочем состоянии. Он полезен как ориентир, что после старта HR работает уже не с draft, а с operational detail кампании.

![Campaign started detail](../assets/manual-first-campaign/step-07b-campaign-started-detail__(SCR-HR-CAMPAIGN-DETAIL).png)

Что руками проверить на этом шаге:

- статус кампании поменялся с `draft` на рабочий;
- detail page показывает progress и operational actions;
- дальнейшее заполнение анкет уже идёт участниками.

### Шаг 8. Участники входят и заполняют анкеты

Сотрудники:

- входят по magic link;
- открывают список анкет;
- сохраняют draft при необходимости;
- отправляют анкеты.

Результат шага:

- кампания получает реальные ответы по всем группам оценивания.

Для beta/manual проверки удобно использовать XE token login helper. Это не замена обычного продукта, а безопасный dev/beta-only способ быстро открыть роль участника и проверить продуктовый экран.

Экран входа с XE token helper:

![XE token login helper](../assets/manual-first-campaign/step-08a-xe-token-login__(SCR-AUTH-LOGIN).png)

Дальше участник открывает список своих анкет.

> Ниже — representative screenshot продукта из acceptance/XE evidence. Он показывает реальный экран анкеты, но не из того же самого HR demo workspace, что шаги `1–7`.

![Questionnaire list](../assets/manual-first-campaign/step-08b-questionnaire-list__(SCR-QUESTIONNAIRES-INBOX).png)

Если участник не готов отправить ответы сразу, он сохраняет draft и возвращается позже.

> Representative screenshot из acceptance/evidence.

![Questionnaire draft](../assets/manual-first-campaign/step-08c-questionnaire-draft__(SCR-QUESTIONNAIRES-FILL).png)

Когда анкета заполнена, участник отправляет её, и она становится read-only.

> Representative screenshot из acceptance/evidence. Здесь показан привычный post-submit вид: анкета остаётся в inbox как read-only история, доступная только для просмотра.

![Questionnaire submitted](../assets/manual-first-campaign/step-08d-questionnaire-submitted__(SCR-QUESTIONNAIRES-FILL).png)

Что руками проверить на этом шаге:

- участник видит только свои анкеты;
- `Save draft` сохраняет промежуточное состояние;
- `Submit` переводит анкету в неизменяемое состояние;
- после первого draft save для кампании срабатывает freeze-policy.

### Шаг 9. Кампания завершается и считаются результаты

После дедлайна или ручного завершения:

- анкеты становятся read-only;
- система считает агрегаты;
- результаты становятся доступны ролям.

Что руками проверить на этом шаге:

- у кампании появляется завершённый lifecycle state;
- новые ответы больше не принимаются;
- role-specific results surfaces начинают возвращать данные, а не empty state.

### Шаг 10. Роли смотрят результаты

- сотрудник видит свой dashboard;
- руководитель видит team results;
- HR видит полную HR-витрину.

Ниже — три итоговых экрана результата. Они сняты на beta/XE evidence и показывают именно те продуктовые surfaces, которые мы хотим видеть в ручном сценарии.

Сотрудник видит личный dashboard без raw comments:

![Employee results](../assets/manual-first-campaign/step-10a-employee-results__(SCR-RESULTS-EMPLOYEE).png)

Руководитель видит командный экран результатов:

![Manager results](../assets/manual-first-campaign/step-10b-manager-results__(SCR-RESULTS-MANAGER).png)

HR видит полную витрину результатов:

![HR results](../assets/manual-first-campaign/step-10c-hr-results__(SCR-RESULTS-HR).png)

Что руками проверить на этом шаге:

- employee не видит raw comments;
- manager видит только допустимое по роли представление;
- HR видит полный surface и может расследовать результаты;
- групповые блоки obey anonymity policy.

## Что есть уже сейчас

Сейчас в продукте уже есть важные части этого пути:

- employee directory;
- org editor;
- models catalog/editor;
- campaigns list/detail/matrix;
- questionnaire flow;
- results surfaces;
- XE token login для beta scenario runs.

То есть tutorial уже можно наполнять реальными walkthrough-скринами и пошаговыми инструкциями.  
Шаги `1–7` уже подтверждены актуальными beta screenshots в demo HR context.  
Шаги `8–10` теперь тоже закрыты наглядными экранами: где возможно — beta live, где нужно — representative screenshots из acceptance/XE evidence.

## Как использовать этот tutorial дальше

Этот документ уже можно использовать как целостный manual walkthrough.  
Дальше его имеет смысл улучшать не за счёт “ещё одного черновика”, а за счёт регулярной актуализации:

1. переснимать живые beta-screen'ы, когда меняется UI;
2. заменять representative screenshots на live walkthrough там, где появляется полный ручной flow;
3. связывать шаги с screen specs и POM, чтобы tutorial, tests и UI-spec говорили на одном языке.

## Связанные документы

- [How `XE-001` works](../explanation/xe-001-walkthrough.md): объясняет похожий по смыслу flow, но через runner. Читать, чтобы не путать manual tutorial и scenario automation.
- [UI sitemap + flows](../../spec/ui/sitemap-and-flows.md): список текущих реализованных поверхностей и planned route groups. Читать, чтобы понимать, на какие реальные экраны можно опираться.
- [UI screen specs](../../spec/ui/screens/index.md): контракты отдельных экранов. Читать, чтобы превращать этот tutorial в точный user flow без догадок.
