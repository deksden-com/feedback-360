create table if not exists notification_outbox (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  recipient_employee_id uuid not null references employees(id) on delete cascade,
  channel text not null default 'email',
  event_type text not null,
  template_key text not null,
  locale text not null default 'ru',
  to_email text not null,
  payload_json jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  idempotency_key text not null,
  attempts integer not null default 0,
  last_error text,
  next_retry_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_notification_outbox_idempotency unique (idempotency_key)
);

create index if not exists idx_notification_outbox_status_created_at
  on notification_outbox (status, created_at);

create index if not exists idx_notification_outbox_campaign
  on notification_outbox (campaign_id);

create table if not exists notification_attempts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  outbox_id uuid not null references notification_outbox(id) on delete cascade,
  attempt_no integer not null,
  provider text not null,
  status text not null,
  provider_message_id text,
  error_message text,
  requested_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint uq_notification_attempt_outbox_attempt unique (outbox_id, attempt_no)
);

create index if not exists idx_notification_attempts_outbox
  on notification_attempts (outbox_id);

alter table notification_outbox enable row level security;
alter table notification_outbox force row level security;
drop policy if exists p_notification_outbox_access on notification_outbox;
create policy p_notification_outbox_access
  on notification_outbox
  for all
  using (app.is_service_role() or app.has_company_access(company_id))
  with check (app.is_service_role() or app.has_company_access(company_id));

alter table notification_attempts enable row level security;
alter table notification_attempts force row level security;
drop policy if exists p_notification_attempts_access on notification_attempts;
create policy p_notification_attempts_access
  on notification_attempts
  for all
  using (app.is_service_role() or app.has_company_access(company_id))
  with check (app.is_service_role() or app.has_company_access(company_id));
