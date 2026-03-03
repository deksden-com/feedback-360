create extension if not exists pgcrypto;

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Europe/Kaliningrad',
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null,
  role text not null,
  created_at timestamptz not null default now(),
  constraint uq_membership_user_company unique(user_id, company_id)
);

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  phone text,
  telegram_user_id text,
  telegram_chat_id text,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists employee_user_links (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  constraint uq_employee_user_link_company_employee unique(company_id, employee_id),
  constraint uq_employee_user_link_company_user unique(company_id, user_id)
);

create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  parent_id uuid,
  name text not null,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists employee_department_history (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  department_id uuid not null references departments(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists employee_manager_history (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  manager_employee_id uuid not null references employees(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists employee_positions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  title text not null,
  level integer,
  start_at timestamptz not null,
  end_at timestamptz,
  created_at timestamptz not null default now()
);
