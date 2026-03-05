create table if not exists ai_comment_aggregates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  subject_employee_id uuid not null references employees(id) on delete cascade,
  competency_id uuid not null references competencies(id) on delete cascade,
  rater_group text not null,
  raw_text text,
  processed_text text,
  summary_text text,
  source text not null default 'mvp_stub',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_ai_comment_aggregate_scope unique (
    campaign_id,
    subject_employee_id,
    competency_id,
    rater_group
  )
);

create index if not exists idx_ai_comment_aggregates_campaign_subject
  on ai_comment_aggregates (campaign_id, subject_employee_id);

alter table ai_comment_aggregates enable row level security;
alter table ai_comment_aggregates force row level security;
drop policy if exists p_ai_comment_aggregates_access on ai_comment_aggregates;
create policy p_ai_comment_aggregates_access
  on ai_comment_aggregates
  for all
  using (app.is_service_role() or app.has_company_access(company_id))
  with check (app.is_service_role() or app.has_company_access(company_id));
