create table if not exists ai_webhook_receipts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  ai_job_id uuid not null references ai_jobs(id) on delete cascade,
  idempotency_key text not null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint uq_ai_webhook_receipt_idempotency unique(idempotency_key)
);

alter table ai_webhook_receipts enable row level security;
alter table ai_webhook_receipts force row level security;
drop policy if exists p_ai_webhook_receipts_access on ai_webhook_receipts;
create policy p_ai_webhook_receipts_access
  on ai_webhook_receipts
  for all
  using (app.is_service_role() or app.has_company_access(company_id))
  with check (app.is_service_role() or app.has_company_access(company_id));
