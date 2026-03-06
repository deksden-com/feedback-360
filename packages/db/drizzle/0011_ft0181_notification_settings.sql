create table if not exists notification_settings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  reminder_scheduled_hour integer not null default 10,
  quiet_hours_start integer not null default 8,
  quiet_hours_end integer not null default 20,
  reminder_weekdays jsonb not null default '[1,3,5]'::jsonb,
  locale text not null default 'ru',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_notification_settings_company unique (company_id)
);

alter table notification_settings enable row level security;
alter table notification_settings force row level security;
drop policy if exists p_notification_settings_access on notification_settings;
create policy p_notification_settings_access
  on notification_settings
  for all
  using (app.is_service_role() or app.has_company_access(company_id))
  with check (app.is_service_role() or app.has_company_access(company_id));
