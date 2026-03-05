# Auth & identity (Supabase)
Status: Draft (2026-03-03)

## Что такое Supabase Auth user
**Supabase Auth user** — это учётная запись в Supabase Auth, которая:
- хранит идентификатор пользователя (`user_id`) и email,
- позволяет выполнять аутентификацию (magic link) и выдавать сессии/токены,
- является “технической” сущностью доступа (не равно Employee).

## Почему User ≠ Employee
- **User** отвечает за “кто вошёл” (аутентификация).
- **Employee** отвечает за “кого оцениваем и кто участвует в оргструктуре” (HR-справочник внутри Company).

## MVP правила
- HR Admin создаёт аккаунты (User) и записи Employee заранее.
- Email у User может быть обновлён (при изменении email у человека).
- Один User соответствует одному email и может состоять в нескольких компаниях через memberships.
- В рамках одной компании пара `user ↔ employee` уникальна (без усложнений на MVP).

## Public signups (agreed)
- Публичные регистрации выключены: пускаем только приглашённых/существующих сотрудников.
- Ограничение по корпоративным доменам email не делаем; достаточно проверки “email есть в HR-справочнике”.

## CLI bootstrap for beta/prod (ops)
- Для оперативного bootstrap доступа используем CLI-команду `auth provision-email`.
- Команда:
  - создаёт/обновляет Supabase Auth user (magic-link identity),
  - синхронизирует HR-справочник (`employees.email`) и связи (`company_memberships`, `employee_user_links`).
- Требуемые секреты и доступ:
  - `SUPABASE_ACCESS_TOKEN` (получение `service_role` key через Management API),
  - `SUPABASE_BETA_DB_POOLER_URL` или `SUPABASE_PROD_DB_POOLER_URL` (запись в project DB).
