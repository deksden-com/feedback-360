create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  status text not null default 'draft',
  timezone text not null default 'Europe/Kaliningrad',
  start_at timestamptz not null,
  end_at timestamptz not null,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists questionnaires (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  subject_employee_id uuid not null references employees(id) on delete cascade,
  rater_employee_id uuid not null references employees(id) on delete cascade,
  status text not null default 'not_started',
  draft_payload jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_questionnaires_campaign_subject_rater unique(campaign_id, subject_employee_id, rater_employee_id)
);
