create table if not exists campaign_employee_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  phone text,
  telegram_user_id text,
  telegram_chat_id text,
  department_id uuid references departments(id) on delete set null,
  manager_employee_id uuid references employees(id) on delete set null,
  position_title text,
  position_level integer,
  snapshot_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint uq_campaign_snapshot_campaign_employee unique(campaign_id, employee_id)
);

alter table campaign_employee_snapshots enable row level security;
alter table campaign_employee_snapshots force row level security;
drop policy if exists p_campaign_employee_snapshots_access on campaign_employee_snapshots;
create policy p_campaign_employee_snapshots_access
  on campaign_employee_snapshots
  for all
  using (app.is_service_role() or app.has_company_access(company_id))
  with check (app.is_service_role() or app.has_company_access(company_id));
