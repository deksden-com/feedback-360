alter table ai_webhook_receipts
  add column if not exists last_received_at timestamptz not null default now(),
  add column if not exists delivery_count integer not null default 1;

update ai_webhook_receipts
set
  last_received_at = coalesce(last_received_at, received_at, now()),
  delivery_count = coalesce(delivery_count, 1);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  campaign_id uuid references campaigns(id) on delete cascade,
  actor_user_id uuid,
  actor_role text,
  source text not null default 'ui',
  event_type text not null,
  object_type text not null,
  object_id text,
  summary text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table audit_events enable row level security;
alter table audit_events force row level security;
drop policy if exists p_audit_events_access on audit_events;
create policy p_audit_events_access
  on audit_events
  using (company_id in (select company_id from company_memberships where user_id = auth.uid()))
  with check (company_id in (select company_id from company_memberships where user_id = auth.uid()));
