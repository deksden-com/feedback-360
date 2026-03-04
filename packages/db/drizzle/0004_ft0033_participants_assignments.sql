create table if not exists campaign_participants (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  include_self boolean not null default true,
  source text not null default 'auto',
  created_at timestamptz not null default now(),
  constraint uq_campaign_participant_campaign_employee unique(campaign_id, employee_id)
);

create table if not exists campaign_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  subject_employee_id uuid not null references employees(id) on delete cascade,
  rater_employee_id uuid not null references employees(id) on delete cascade,
  rater_role text not null,
  source text not null default 'auto',
  created_at timestamptz not null default now(),
  constraint uq_campaign_assignment_campaign_subject_rater unique(campaign_id, subject_employee_id, rater_employee_id)
);

alter table campaign_participants enable row level security;
alter table campaign_participants force row level security;
drop policy if exists p_campaign_participants_access on campaign_participants;
create policy p_campaign_participants_access
  on campaign_participants
  for all
  using (app.is_service_role() or app.has_company_access(company_id))
  with check (app.is_service_role() or app.has_company_access(company_id));

alter table campaign_assignments enable row level security;
alter table campaign_assignments force row level security;
drop policy if exists p_campaign_assignments_access on campaign_assignments;
create policy p_campaign_assignments_access
  on campaign_assignments
  for all
  using (app.is_service_role() or app.has_company_access(company_id))
  with check (app.is_service_role() or app.has_company_access(company_id));
