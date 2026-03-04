create table if not exists competency_model_versions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  kind text not null,
  version integer not null,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_competency_model_versions_company_name_version unique(company_id, name, version)
);

create table if not exists competency_groups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  model_version_id uuid not null references competency_model_versions(id) on delete cascade,
  name text not null,
  weight integer not null,
  "order" integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists competencies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  model_version_id uuid not null references competency_model_versions(id) on delete cascade,
  group_id uuid not null references competency_groups(id) on delete cascade,
  name text not null,
  "order" integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists competency_indicators (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  competency_id uuid not null references competencies(id) on delete cascade,
  text text not null,
  "order" integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists competency_levels (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  competency_id uuid not null references competencies(id) on delete cascade,
  level integer not null,
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table campaigns
  add column if not exists model_version_id uuid references competency_model_versions(id) on delete set null;

alter table competency_model_versions enable row level security;
alter table competency_model_versions force row level security;
drop policy if exists p_competency_model_versions_access on competency_model_versions;
create policy p_competency_model_versions_access
  on competency_model_versions
  for all
  using (app.is_service_role() or app.has_company_access(company_id))
  with check (app.is_service_role() or app.has_company_access(company_id));

alter table competency_groups enable row level security;
alter table competency_groups force row level security;
drop policy if exists p_competency_groups_access on competency_groups;
create policy p_competency_groups_access
  on competency_groups
  for all
  using (app.is_service_role() or app.has_company_access(company_id))
  with check (app.is_service_role() or app.has_company_access(company_id));

alter table competencies enable row level security;
alter table competencies force row level security;
drop policy if exists p_competencies_access on competencies;
create policy p_competencies_access
  on competencies
  for all
  using (app.is_service_role() or app.has_company_access(company_id))
  with check (app.is_service_role() or app.has_company_access(company_id));

alter table competency_indicators enable row level security;
alter table competency_indicators force row level security;
drop policy if exists p_competency_indicators_access on competency_indicators;
create policy p_competency_indicators_access
  on competency_indicators
  for all
  using (app.is_service_role() or app.has_company_access(company_id))
  with check (app.is_service_role() or app.has_company_access(company_id));

alter table competency_levels enable row level security;
alter table competency_levels force row level security;
drop policy if exists p_competency_levels_access on competency_levels;
create policy p_competency_levels_access
  on competency_levels
  for all
  using (app.is_service_role() or app.has_company_access(company_id))
  with check (app.is_service_role() or app.has_company_access(company_id));
