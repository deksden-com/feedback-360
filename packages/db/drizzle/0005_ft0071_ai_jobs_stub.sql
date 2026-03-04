create table if not exists ai_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  provider text not null default 'mvp_stub',
  status text not null default 'completed',
  idempotency_key text not null,
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  error_payload jsonb,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_ai_job_campaign_idempotency unique(campaign_id, idempotency_key)
);

alter table ai_jobs enable row level security;
alter table ai_jobs force row level security;
drop policy if exists p_ai_jobs_access on ai_jobs;
create policy p_ai_jobs_access
  on ai_jobs
  for all
  using (app.is_service_role() or app.has_company_access(company_id))
  with check (app.is_service_role() or app.has_company_access(company_id));
